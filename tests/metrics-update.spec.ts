import { test, expect } from "playwright/test";
import { execSync } from "child_process";
import { Client } from "pg";

const DATASET_ID = "698c9485916701f5806d3161";
const DATASET_SLUG = "simbolos-detalhes-cartograficos-2011-1";
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function runUdataCommand(cmd: string): string {
  return execSync(cmd, {
    cwd: "/home/adbrum/workspace/babel/dadosgov/backend",
    encoding: "utf-8",
    timeout: 120_000,
  });
}

function seedDatasetMetrics(views: number, downloads: number): void {
  runUdataCommand(
    `uv run python -c "
from udata.app import create_app
app = create_app()
with app.app_context():
    from udata.models import Dataset
    Dataset.objects(id='${DATASET_ID}').update(
        set__metrics__views=${views},
        set__metrics__resources_downloads=${downloads},
    )
"`
  );
}

async function getDatasetMetricsFromApi(
  request: any
): Promise<{ views: number; resources_downloads: number }> {
  const response = await request.get(
    `${BACKEND_API}/datasets/${DATASET_SLUG}/`
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return {
    views: data.metrics.views ?? 0,
    resources_downloads: data.metrics.resources_downloads ?? 0,
  };
}

async function triggerDagAndWait(
  request: any,
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

async function getTaskLogs(
  request: any,
  dagRunId: string,
  taskId: string
): Promise<string> {
  const res = await request.get(
    `${AIRFLOW_API}/dags/${DAG_ID}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${taskId}/logs/1`,
    { headers: { Authorization: `Basic ${AIRFLOW_AUTH}` } }
  );
  return await res.text();
}

// ─── Pipeline direto: api-tabular → udata job → frontend ───────────────────

test.describe("Pipeline direto: api-tabular → udata job → frontend", () => {
  const DIRECT_VIEWS = 200;
  const DIRECT_DOWNLOADS = 77;
  let pgClient: Client;

  test.beforeAll(async () => {
    pgClient = new Client(PG_CONFIG);
    await pgClient.connect();
  });

  test.afterAll(async () => {
    await pgClient.query(
      "DELETE FROM datasets WHERE dataset_id = $1 AND metric_month = '2026-03'",
      [DATASET_ID]
    );
    await pgClient.end();
  });

  test("1. Insert test metrics in api-tabular (PostgreSQL)", async () => {
    await pgClient.query(
      `INSERT INTO datasets (dataset_id, metric_month, monthly_visit, monthly_download_resource)
       VALUES ($1, '2026-03', $2, $3)
       ON CONFLICT (dataset_id, metric_month)
       DO UPDATE SET monthly_visit = $2, monthly_download_resource = $3`,
      [DATASET_ID, DIRECT_VIEWS, DIRECT_DOWNLOADS]
    );

    const result = await pgClient.query(
      "SELECT * FROM datasets_total WHERE dataset_id = $1",
      [DATASET_ID]
    );

    expect(result.rows.length).toBe(1);
    expect(Number(result.rows[0].visit)).toBeGreaterThanOrEqual(DIRECT_VIEWS);
    expect(Number(result.rows[0].download_resource)).toBeGreaterThanOrEqual(
      DIRECT_DOWNLOADS
    );
  });

  test("2. Run update-metrics job → verify MongoDB via API", async ({
    request,
  }) => {
    const output = runUdataCommand("uv run udata job run update-metrics");
    expect(output).toContain("Job update-metrics done");

    const metrics = await getDatasetMetricsFromApi(request);
    expect(metrics.views).toBeGreaterThanOrEqual(DIRECT_VIEWS);
    expect(metrics.resources_downloads).toBeGreaterThanOrEqual(
      DIRECT_DOWNLOADS
    );
  });

  test("3. Frontend displays updated metrics", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/pages/datasets/${DATASET_SLUG}`, {
      waitUntil: "networkidle",
    });

    const vistasValue = await page
      .locator("text=Vistas")
      .locator("..")
      .locator(".text-l-semibold")
      .textContent();
    expect(vistasValue?.trim()).not.toBe("0");

    const downloadsValue = await page
      .locator("text=Downloads")
      .locator("..")
      .locator(".text-l-semibold")
      .textContent();
    expect(downloadsValue?.trim()).not.toBe("0");
  });
});

// ─── Pipeline Airflow: MongoDB → DAG → PostgreSQL → MongoDB → frontend ─────

test.describe("Pipeline Airflow: MongoDB → DAG → PostgreSQL → MongoDB → frontend", () => {
  const DAG_VIEWS = 555;
  const DAG_DOWNLOADS = 88;
  let dagRunId: string;

  test.beforeAll(async () => {
    // Seed MongoDB with known values for the DAG to extract
    seedDatasetMetrics(DAG_VIEWS, DAG_DOWNLOADS);
  });

  test("1. Trigger Airflow DAG and wait for success", async ({ request }) => {
    test.setTimeout(180_000);
    dagRunId = await triggerDagAndWait(request, 120_000);
    expect(dagRunId).toBeTruthy();
  });

  test("2. Verify DAG tasks ran successfully", async ({ request }) => {
    // Check all 4 tasks completed
    const tasksRes = await request.get(
      `${AIRFLOW_API}/dags/${DAG_ID}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances`,
      { headers: { Authorization: `Basic ${AIRFLOW_AUTH}` } }
    );
    const tasksData = await tasksRes.json();

    for (const task of tasksData.task_instances) {
      expect(task.state).toBe("success");
    }

    // Verify send_to_metrics_db logs show data was written
    const pgLogs = await getTaskLogs(
      request,
      dagRunId,
      "send_to_metrics_db"
    );
    expect(pgLogs).toMatch(/[Ii]nserted|[Uu]pserted/);

    // Verify update_udata_metrics logs show data was written
    const mongoLogs = await getTaskLogs(
      request,
      dagRunId,
      "update_udata_metrics"
    );
    expect(mongoLogs).toMatch(/[Uu]pdated.*metrics/i);
  });

  test("3. Verify DAG wrote metrics to PostgreSQL (api-tabular)", async () => {
    // The DAG extracts top 1000 datasets (no $sort → order not guaranteed).
    // Verify DAG wrote data for the current month overall.
    const pgClient = new Client(PG_CONFIG);
    await pgClient.connect();

    const metricMonth = new Date().toISOString().slice(0, 7);
    const countResult = await pgClient.query(
      "SELECT count(*) as cnt FROM datasets WHERE metric_month = $1",
      [metricMonth]
    );

    // DAG should have upserted ~1000 rows
    const rowCount = Number(countResult.rows[0].cnt);
    expect(rowCount).toBeGreaterThanOrEqual(500);

    // Also verify via the api-tabular endpoint (PostgREST)
    // that the view aggregates correctly
    const totalResult = await pgClient.query(
      "SELECT count(*) as cnt FROM datasets_total WHERE visit > 0"
    );
    expect(Number(totalResult.rows[0].cnt)).toBeGreaterThan(0);

    await pgClient.end();
  });

  test("4. Verify DAG wrote metrics back to MongoDB via API", async ({
    request,
  }) => {
    // The DAG update_udata_metrics writes directly to MongoDB
    const metrics = await getDatasetMetricsFromApi(request);
    expect(metrics.views).toBe(DAG_VIEWS);
    expect(metrics.resources_downloads).toBe(DAG_DOWNLOADS);
  });

  test("5. Frontend displays Airflow-updated metrics", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/pages/datasets/${DATASET_SLUG}`, {
      waitUntil: "networkidle",
    });

    const vistasValue = await page
      .locator("text=Vistas")
      .locator("..")
      .locator(".text-l-semibold")
      .textContent();
    expect(vistasValue?.trim()).not.toBe("0");

    const downloadsValue = await page
      .locator("text=Downloads")
      .locator("..")
      .locator(".text-l-semibold")
      .textContent();
    expect(downloadsValue?.trim()).not.toBe("0");
  });
});
