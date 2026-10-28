/**
 * The resource card's download control.
 *
 * The href is the backend's download permalink (`/api/1/datasets/r/<id>/`), not a
 * route. Rendering it as `next/link` made the router prefetch it on sight: the
 * backend went and fetched the file from its origin with nobody asking, answering
 * 502 when that origin was slow, or the OGC 302 the browser then blocked on
 * `connect-src` — and either way the global API error policy raised a toast on a
 * page where nothing was wrong (LEDG-2675).
 *
 * So the regression this file guards is not "an anchor is rendered" but "the
 * download control is NOT a router link". `next/link` is therefore mocked with a
 * marked element: if anyone wraps the button in a `<Link>` again, the marker
 * appears and these tests fail.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptCommon from "@/locales/pt/common.json";
import ptDatasets from "@/locales/pt/datasets.json";

/** A `<Link>` renders as an anchor carrying the marker the assertions look for. */
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a data-next-link="true" {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/** The modal is opened by the sibling button; the card only needs the handles. */
const show = vi.fn();
const hide = vi.fn();
vi.mock("@ama-pt/agora-design-system", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useModalContext: () => ({ show, hide }) };
});

/**
 * Resolve the real Portuguese strings so the assertions read like the UI and a
 * removed or renamed translation key fails the test.
 */
const dictionaries: Record<string, unknown> = { common: ptCommon, datasets: ptDatasets };

const translateFrom = (namespace: string) => (key: string, options?: Record<string, unknown>) => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      dictionaries[namespace]
    );
  if (typeof raw !== "string") return key;
  return raw.replace(/{{(\w+)}}/g, (_, name: string) => String(options?.[name] ?? ""));
};

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: translateFrom(namespace ?? "common"),
    i18n: { language: "pt" },
  }),
}));

import { Resource } from "@/service/types/dataset";
import { ResourceCard } from "../ResourceCard";
import { downloadUrl } from "../utils";

/** A hosted file: the ordinary case, served from our own storage. */
const HOSTED: Resource = {
  id: "aaaaaaaa-1111-bbbb-2222-cccccccccccc",
  title: "Ocorrências 2026",
  format: "csv",
  url: "https://dados.gov.pt/s/resources/ocorrencias.csv",
  filetype: "file",
  created_at: "2026-01-05T10:00:00+00:00",
  last_modified: "2026-02-01T10:00:00+00:00",
  extras: {},
} as Resource;

/**
 * A WMS service: the backend answers `/r/<id>` with a 302 to the producer, which
 * is exactly what a prefetch could not follow without violating `connect-src`.
 */
const WMS: Resource = {
  id: "bbbbbbbb-3333-cccc-4444-dddddddddddd",
  title: "Serviço de visualização WMS",
  format: "wms",
  url: "https://sig.exemplo.pt/server/services/UAS/MapServer/WMSServer?request=GetCapabilities&service=WMS",
  filetype: "remote",
  created_at: "2026-01-05T10:00:00+00:00",
  last_modified: "2026-02-01T10:00:00+00:00",
  extras: {},
} as Resource;

let container: HTMLDivElement;
let root: Root;

async function renderCard(resource: Resource) {
  await act(async () => {
    root.render(<ResourceCard resource={resource} />);
  });
}

/** The anchor pointing at the backend download permalink, whatever wraps it. */
const downloadAnchor = (resource: Resource) =>
  container.querySelector<HTMLAnchorElement>(`a[href="${downloadUrl(resource)}"]`);

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.clearAllMocks();
});

describe("resource download control", () => {
  it("renders the download control as a plain anchor, never a next/link", async () => {
    await renderCard(HOSTED);

    const anchor = downloadAnchor(HOSTED);
    expect(anchor).not.toBeNull();
    // The whole point: a router link would prefetch this href on sight.
    expect(anchor?.dataset.nextLink).toBeUndefined();
    expect(container.querySelector("[data-next-link]")).toBeNull();
  });

  it("does not prefetch a WMS resource either, whose permalink redirects off-site", async () => {
    await renderCard(WMS);

    expect(downloadAnchor(WMS)).not.toBeNull();
    expect(container.querySelector("[data-next-link]")).toBeNull();
  });

  it("opens the download in a new tab, with the opener severed", async () => {
    await renderCard(HOSTED);

    const anchor = downloadAnchor(HOSTED);
    expect(anchor?.target).toBe("_blank");
    expect(anchor?.rel).toContain("noopener");
  });

  it("leaves the filename to the backend's Content-Disposition", async () => {
    await renderCard(HOSTED);

    // A client-side `download` would override the name `_ensure_extension`
    // builds server-side, which is what LEDG-1765 fixed.
    expect(downloadAnchor(HOSTED)?.hasAttribute("download")).toBe(false);
  });
});
