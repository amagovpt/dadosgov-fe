import { test, expect, type APIRequestContext } from "playwright/test";
import { execSync } from "child_process";
import { Client } from "pg";

const DATASET_ID = "698c9485916701f5806d3161";
const DATASET_SLUG = "simbolos-detalhes-cartograficos-2011-1";
const RESOURCE_ID = "38d22645-8c74-40c5-b2a0-c79279b167cd";
const FRONTEND_URL = "http://localhost:3000";
const BACKEND_API = "http://localhost:7000/api/1";
const AIRFLOW_API = "http://localhost:18080/api/v1";
const AIRFLOW_AUTH = Buffer.from("adbrum:ArVl92br").toString("base64");
const DAG_ID = "exemplo_etl";

const PG_CONFIG = {
  host: "localhost",
  port: 5434,
  user: "postgres",
  password: "postgres",
  database: "postgres",
};

const BACKEND_DIR = "/home/adbrum/workspace/babel/dadosgov/backend";
const NUM_DOWNLOADS = 5;

function runUdata(cmd: string): string {
  return execSync(cmd, {
    cwd: BACKEND_DIR,
    encoding: "utf-8",
    timeout: 120_000,
  });
}

async function triggerDagAndWait(
  request: APIRequestContext,
  maxWaitMs = 120_000,
  pollMs = 3_000
): Promise<string> {
  const triggerRes = await request.post(
    `${AIRFLOW_API}/dags/${DAG_ID}/dagRuns`,
    {
      headers: {
        Authorization: `Basic ${AIRFLOW_AUTH}`,
        "Content-Type": "application/json",
      },
      data: { conf: {} },
    }
  );
  expect(triggerRes.ok()).toBeTruthy();
  const { dag_run_id: dagRunId } = await triggerRes.json();

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const statusRes = await request.get(
      `${AIRFLOW_API}/dags/${DAG_ID}/dagRuns/${encodeURIComponent(dagRunId)}`,
      { headers: { Authorization: `Basic ${AIRFLOW_AUTH}` } }
    );
    const { state } = await statusRes.json();
    if (state === "success") return dagRunId;
    if (state === "failed") throw new Error(`DAG run ${dagRunId} failed`);
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(`DAG run ${dagRunId} timed out after ${maxWaitMs}ms`);
}

test.describe("Downloads pipeline: tracking → Airflow → PostgreSQL → MongoDB → frontend", () => {
  test.setTimeout(180_000);

  let downloadsBefore: number;

  test("1. Clear previous download events and record baseline", async () => {
    // Get current download count from tracking_events
    const output = runUdata(`uv run python -c "
from udata.app import create_app, standalone
app = create_app()
standalone(app)
with app.app_context():
    from udata.core.metrics.tracking import TrackingEvent
    count = TrackingEvent.objects(object_id='${DATASET_ID}', event_type='download').count()
    print(count)
"`);
    downloadsBefore = parseInt(output.trim(), 10);
    expect(downloadsBefore).toBeGreaterThanOrEqual(0);
  });

  test("2. Generate download events via resource redirect", async () => {
    // Generate downloads using the app test client (ensures latest code is used)
    const output = runUdata(`uv run python -c "
from udata.app import create_app, standalone
app = create_app()
standalone(app)
with app.test_client() as client:
    for i in range(${NUM_DOWNLOADS}):
        resp = client.get('/api/1/datasets/r/${RESOURCE_ID}/')
        assert resp.status_code in (200, 301, 302), f'Unexpected status: {resp.status_code}'
with app.app_context():
    from udata.core.metrics.tracking import TrackingEvent
    count = TrackingEvent.objects(object_id='${DATASET_ID}', event_type='download').count()
    print(count)
"`);
    const downloadsAfter = parseInt(output.trim(), 10);
    expect(downloadsAfter).toBe(downloadsBefore + NUM_DOWNLOADS);
  });

  test("3. Trigger Airflow DAG and verify PostgreSQL update", async ({
    request,
  }) => {
    const dagRunId = await triggerDagAndWait(request);
    expect(dagRunId).toBeTruthy();

    // Verify downloads in PostgreSQL
    const pgClient = new Client(PG_CONFIG);
    await pgClient.connect();

    const metricMonth = new Date().toISOString().slice(0, 7);
    const result = await pgClient.query(
      "SELECT * FROM datasets WHERE dataset_id = $1 AND metric_month = $2",
      [DATASET_ID, metricMonth]
    );
    await pgClient.end();

    expect(result.rows.length).toBe(1);
    expect(Number(result.rows[0].monthly_download_resource)).toBeGreaterThanOrEqual(
      NUM_DOWNLOADS
    );
  });

  test("4. Verify MongoDB has updated resources_downloads via API", async ({
    request,
  }) => {
    const response = await request.get(
      `${BACKEND_API}/datasets/${DATASET_SLUG}/`
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.metrics.resources_downloads).toBeGreaterThanOrEqual(
      NUM_DOWNLOADS
    );
  });

  test("5. Frontend displays updated download count", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/datasets/${DATASET_SLUG}`, {
      waitUntil: "networkidle",
    });

    const downloadsBlock = page.locator("text=Downloads").locator("..");
    const downloadsValue = await downloadsBlock
      .locator(".text-l-semibold")
      .textContent();

    expect(downloadsValue?.trim()).not.toBe("0");
    expect(downloadsValue?.trim().length).toBeGreaterThan(0);
  });
});
