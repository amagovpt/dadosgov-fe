/**
 * Renders the resource preview for the two kinds of file it has to serve:
 *
 *  1. A REMOTE resource already ingested by the hydra/api-tabular pipeline
 *     (`analysis:parsing:finished_at` set, no error) — the preview must be
 *     served by the api-tabular proxies, paginated server-side, with the
 *     csv-detective column types in the structure tab.
 *  2. A resource NOT in api-tabular (never analysed) — the preview must fall
 *     back to the byte proxy (`proxy-csv`) and be parsed in the app, with the
 *     heuristic column types.
 *
 * The boundary between the two is the whole point of the feature, so the
 * suite asserts not only what each path renders but also that neither path
 * calls the other's endpoints. A third case covers the downgrade: a resource
 * whose extras claim it was analysed but that api-tabular no longer serves.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptDatasets from "@/locales/pt/datasets.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * Resolve the real Portuguese strings so the assertions read like the UI and
 * a removed/renamed translation key fails the test.
 */
const translate = (key: string, options?: Record<string, unknown>): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      ptDatasets as unknown
    );
  if (typeof raw !== "string") return key;
  return raw.replace(/{{(\w+)}}/g, (_, name: string) => String(options?.[name] ?? ""));
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate,
    i18n: { language: "pt" },
  }),
}));

import { Resource } from "@/service/types/dataset";
import { ResourceExpandedContent } from "../ResourceExpandedContent";

// --- HTTP doubles -----------------------------------------------------------

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
  text: async () => JSON.stringify(body),
  headers: { get: () => null },
});

const textResponse = (body: string) => ({
  ok: true,
  status: 200,
  json: async () => JSON.parse(body),
  text: async () => body,
  headers: { get: () => null },
});

const notFoundResponse = () => ({
  ok: false,
  status: 404,
  json: async () => ({ error: "not-ingested" }),
  text: async () => "not-ingested",
  headers: { get: () => null },
});

/** What api-tabular serves for the ingested resource: page 1 of 42 rows. */
const TABULAR_PAGE_1 = {
  data: [
    { __id: 1, Municipio: "Lisboa", Alojamentos: 1200 },
    { __id: 2, Municipio: "Porto", Alojamentos: 830 },
  ],
  meta: { page: 1, page_size: 5, total: 42 },
};

const TABULAR_PAGE_2 = {
  data: [{ __id: 6, Municipio: "Faro", Alojamentos: 410 }],
  meta: { page: 2, page_size: 5, total: 42 },
};

const TABULAR_PROFILE = {
  profile: {
    header: ["Municipio", "Alojamentos"],
    columns: {
      Municipio: { python_type: "string", format: "string", score: 1 },
      Alojamentos: { python_type: "int", format: "int", score: 1 },
    },
    total_lines: 42,
  },
};

/** What the byte proxy serves for the resource api-tabular does not know. */
const RAW_CSV = ["Concelho,Ocorrencias", "Sintra,15", "Cascais,9", "Oeiras,4"].join("\n");

// --- Fixtures ---------------------------------------------------------------

/** Remote file already analysed by hydra → previewed through api-tabular. */
const REMOTE_INGESTED: Resource = {
  id: "aaaaaaaa-1111-bbbb-2222-cccccccccccc",
  title: "Alojamentos turísticos (ficheiro remoto)",
  format: "csv",
  url: "https://exemplo.pt/alojamentos.csv",
  filetype: "remote",
  created_at: "2026-01-05T10:00:00+00:00",
  last_modified: "2026-02-01T10:00:00+00:00",
  extras: {
    "analysis:parsing:finished_at": "2026-08-18T03:12:00+00:00",
    "analysis:parsing:parsing_table": "7fdf88f7f45cde7028f03dcbf252e139",
  },
};

/** Hosted file never analysed → previewed through the byte proxy. */
const NOT_INGESTED: Resource = {
  id: "bbbbbbbb-3333-cccc-4444-dddddddddddd",
  title: "Ocorrências (ficheiro carregado)",
  format: "csv",
  url: "https://dados.gov.pt/s/resources/ocorrencias.csv",
  filetype: "file",
  created_at: "2026-03-10T09:00:00+00:00",
  extras: {},
};

// --- Render harness ---------------------------------------------------------

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

/** Route each request to its double and record the calls for assertions. */
function stubFetch(handlers: Record<string, () => unknown>) {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = Object.keys(handlers).find((prefix) => url.includes(prefix));
    if (!match) throw new Error(`Unexpected request: ${url}`);
    return handlers[match]() as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
}

const requestedUrls = () => fetchMock.mock.calls.map(([input]) => String(input));

async function renderPreview(resource: Resource) {
  await act(async () => {
    root.render(<ResourceExpandedContent resource={resource} />);
  });
  // Let the fetch promises and their state updates settle.
  await act(async () => {
    await Promise.resolve();
  });
}

/** First cell of each rendered data row, in screen order. */
function rowsOnScreen(): string[] {
  return Array.from(container.querySelectorAll("tbody tr")).map(
    (tr) => tr.querySelector("td")?.textContent?.trim() ?? ""
  );
}

/** Click the sort control of a column header. */
async function clickHeader(name: string) {
  const header = Array.from(container.querySelectorAll("th")).find((th) =>
    th.textContent?.trim().startsWith(name)
  );
  if (!header) throw new Error(`No column header "${name}"`);
  // The design system wraps the label in its own sort button when the column
  // is sortable; fall back to the cell itself if it ever stops doing so.
  const control = (header.querySelector("button") ?? header) as HTMLElement;
  await act(async () => {
    // The design system's Button ignores clicks with `detail === 0` (it reads
    // them as programmatic), which is exactly what `HTMLElement.click()`
    // produces — dispatch a click that looks like a real one instead.
    control.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
  });
  await act(async () => {
    await Promise.resolve();
  });
}

/** Click a rendered element by its exact text (tab headers, page buttons). */
async function clickByText(selector: string, text: string) {
  const target = Array.from(container.querySelectorAll(selector)).find(
    (el) => el.textContent?.trim() === text
  );
  if (!target) throw new Error(`No ${selector} with text "${text}"`);
  await act(async () => {
    (target as HTMLElement).click();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

/**
 * jsdom implements no layout and no media queries, both of which the design
 * system touches while paginating. Fill the two gaps so a click does not blow
 * up on the environment instead of the code under test.
 */
function stubLayoutApis() {
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  stubLayoutApis();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// --- The two file kinds -----------------------------------------------------

describe("resource preview — remote file served by api-tabular", () => {
  beforeEach(() => {
    stubFetch({
      "proxy-tabular-data": () => jsonResponse(TABULAR_PAGE_1),
      "proxy-tabular-profile": () => jsonResponse(TABULAR_PROFILE),
    });
  });

  it("reads the first page from api-tabular and never touches the byte proxies", async () => {
    await renderPreview(REMOTE_INGESTED);

    const urls = requestedUrls();
    expect(urls.some((url) => url.includes("proxy-tabular-profile"))).toBe(true);

    const dataUrl = urls.find((url) => url.includes("proxy-tabular-data"));
    expect(dataUrl).toBeDefined();
    expect(dataUrl).toContain(`rid=${REMOTE_INGESTED.id}`);
    expect(dataUrl).toContain("page=1");
    // data.gouv.fr shows 5 rows per page; the whole file stays on the server.
    expect(dataUrl).toContain("page_size=5");

    // A remote resource is previewable once analysed, so the byte proxies —
    // which would download the file — must stay untouched.
    expect(urls.some((url) => url.includes("proxy-csv"))).toBe(false);
    expect(urls.some((url) => url.includes("proxy-spreadsheet"))).toBe(false);
  });

  it("renders the rows served by api-tabular, without the synthetic __id", async () => {
    await renderPreview(REMOTE_INGESTED);

    expect(container.textContent).toContain("Lisboa");
    expect(container.textContent).toContain("1200");
    expect(container.textContent).toContain("Porto");

    const headers = Array.from(container.querySelectorAll("th")).map((th) =>
      th.textContent?.trim()
    );
    expect(headers).toContain("Municipio");
    expect(headers).toContain("Alojamentos");
    expect(headers.some((header) => header?.includes("__id"))).toBe(false);
  });

  it("reports the full row count of the file, not the rows on screen", async () => {
    await renderPreview(REMOTE_INGESTED);

    // 42 rows total even though only 2 are on this page — the count comes from
    // `meta.total`, and the "limited preview" suffix belongs to the fallback.
    expect(container.textContent).toContain(
      translate("resources.preview.footer", {
        date: "18 de agosto de 2026",
        cols: 2,
        rows: 42,
      })
    );
    expect(container.textContent).not.toContain(
      translate("resources.preview.limited", { count: 2 })
    );
  });

  it("fetches the next page from the server instead of slicing in memory", async () => {
    await renderPreview(REMOTE_INGESTED);
    stubFetch({
      "proxy-tabular-data": () => jsonResponse(TABULAR_PAGE_2),
      "proxy-tabular-profile": () => jsonResponse(TABULAR_PROFILE),
    });

    await clickByText("button", "2");

    expect(requestedUrls().some((url) => url.includes("page=2"))).toBe(true);
    expect(container.textContent).toContain("Faro");
  });

  it("asks the server to sort instead of reordering the page on screen", async () => {
    await renderPreview(REMOTE_INGESTED);
    stubFetch({
      "proxy-tabular-data": () => jsonResponse(TABULAR_PAGE_1),
      "proxy-tabular-profile": () => jsonResponse(TABULAR_PROFILE),
    });

    await clickHeader("Alojamentos");

    const sortUrl = requestedUrls().find((url) => url.includes("sort_by"));
    expect(sortUrl).toBeDefined();
    expect(sortUrl).toContain("sort_by=Alojamentos");
    expect(sortUrl).toMatch(/sort_dir=(asc|desc)/);
    // Sorting restarts the listing, so the request is for the first page.
    expect(sortUrl).toContain("page=1");
  });

  it("types the columns from the csv-detective profile", async () => {
    await renderPreview(REMOTE_INGESTED);
    await clickByText("button", translate("resources.tabs.structure"));

    // `int` comes from api-tabular's profile; the in-app heuristics are not
    // consulted on this path.
    expect(container.textContent).toContain("int");
  });
});

describe("resource preview — file unknown to api-tabular", () => {
  beforeEach(() => {
    stubFetch({ "proxy-csv": () => textResponse(RAW_CSV) });
  });

  it("goes straight to the byte proxy without asking api-tabular", async () => {
    await renderPreview(NOT_INGESTED);

    const urls = requestedUrls();
    expect(urls.some((url) => url.includes(`proxy-csv?rid=${NOT_INGESTED.id}`))).toBe(true);
    // No successful analysis in the extras, so the tabular endpoints are never
    // even attempted.
    expect(urls.some((url) => url.includes("proxy-tabular"))).toBe(false);
  });

  it("renders the rows parsed in the app", async () => {
    await renderPreview(NOT_INGESTED);

    expect(container.textContent).toContain("Sintra");
    expect(container.textContent).toContain("Cascais");

    // The design system repeats each header inside the cells for its mobile
    // layout, hence the dedupe.
    const headers = new Set(
      Array.from(container.querySelectorAll("th")).map((th) => th.textContent?.trim())
    );
    expect(headers).toEqual(new Set(["Concelho", "Ocorrencias"]));
  });

  it("sorts on a header click, numerically and without going back to the network", async () => {
    await renderPreview(NOT_INGESTED);
    const callsBeforeSort = fetchMock.mock.calls.length;

    await clickHeader("Ocorrencias");
    const firstAfterOneClick = rowsOnScreen()[0];
    await clickHeader("Ocorrencias");
    const firstAfterTwoClicks = rowsOnScreen()[0];

    // Ocorrencias holds 15/9/4. Sorted as numbers the extremes lead each
    // direction (Sintra=15, Oeiras=4); a lexicographic sort would have put
    // "9" (Cascais) on top of one of them.
    expect(new Set([firstAfterOneClick, firstAfterTwoClicks])).toEqual(
      new Set(["Sintra", "Oeiras"])
    );

    // The whole file is already in memory: sorting must not refetch it.
    expect(fetchMock.mock.calls.length).toBe(callsBeforeSort);
  });

  it("reports the row count read from the file itself", async () => {
    await renderPreview(NOT_INGESTED);

    expect(container.textContent).toContain(
      translate("resources.preview.footer", {
        date: "10 de março de 2026",
        cols: 2,
        rows: 3,
      })
    );
  });
});

describe("resource preview — analysed resource api-tabular no longer serves", () => {
  it("downgrades to the byte proxy instead of showing an empty preview", async () => {
    stubFetch({
      "proxy-tabular-data": () => notFoundResponse(),
      "proxy-tabular-profile": () => notFoundResponse(),
      "proxy-csv": () => textResponse(RAW_CSV),
    });

    await renderPreview(REMOTE_INGESTED);
    // The downgrade is a second render pass: settle the fallback fetch too.
    await act(async () => {
      await Promise.resolve();
    });

    const urls = requestedUrls();
    expect(urls.some((url) => url.includes("proxy-tabular-data"))).toBe(true);
    expect(urls.some((url) => url.includes("proxy-csv"))).toBe(true);
    expect(container.textContent).toContain("Sintra");
  });
});
