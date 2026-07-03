import { test, expect, type Page, type APIRequestContext } from "playwright/test";

/**
 * Public dataservice (API) detail page.
 *
 * Covers the sidebar restructured into separate blue boxes (identity /
 * "Condições de Acesso" / "Características técnicas"), the derived
 * "Autenticação" field, the prominent "Pedir acesso" button for restricted
 * APIs, and the technical box that only renders when it has content.
 *
 * Read-only: discovers public dataservices through the same API the listing
 * consumes (the listing cards navigate via router.push, not <a href>) and
 * never mutates records. Tests skip gracefully when no suitable record exists.
 */
type DS = {
  slug: string;
  access_type: string | null;
  authorization_request_url: string | null;
  base_api_url: string | null;
  rate_limiting: string | null;
  availability: number | null;
  technical_documentation_url: string | null;
  business_documentation_url: string | null;
};

async function fetchPublicDataservices(request: APIRequestContext): Promise<DS[]> {
  const res = await request.get("/api/1/dataservices/?page_size=50");
  if (!res.ok()) return [];
  const body = await res.json();
  return (body?.data ?? []) as DS[];
}

function hasTechnical(ds: DS): boolean {
  return Boolean(
    ds.base_api_url ||
      ds.rate_limiting ||
      ds.availability != null ||
      ds.technical_documentation_url ||
      ds.business_documentation_url
  );
}

async function gotoDetail(page: Page, slug: string) {
  await page.goto(`/dataservices/${slug}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15000 });
}

test.describe("Dataservice Detail", () => {
  test("SDD-01: Page loads with a non-empty title and APIs breadcrumb", async ({
    page,
    request,
  }) => {
    const list = await fetchPublicDataservices(request);
    test.skip(list.length === 0, "No public dataservices in the database");
    await gotoDetail(page, list[0].slug);

    const titleText = await page.locator("main h1").first().textContent();
    expect(titleText?.trim().length ?? 0).toBeGreaterThan(0);

    const breadcrumb = page.locator(".agora-breadcrumb").first();
    await expect(breadcrumb).toBeAttached({ timeout: 10000 });
    expect((await breadcrumb.textContent())?.toLowerCase()).toContain("apis");
  });

  test("SDD-02: 'Condições de Acesso' box shows Acesso + Autenticação", async ({
    page,
    request,
  }) => {
    const list = await fetchPublicDataservices(request);
    test.skip(list.length === 0, "No public dataservices in the database");
    await gotoDetail(page, list[0].slug);

    await expect(page.getByText("Condições de Acesso").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Acesso", { exact: true }).first()).toBeVisible();
    // Authentication is always rendered (derived from the access type, with a
    // "Não comunicado" fallback) so it is a deterministic anchor.
    await expect(page.getByText("Autenticação").first()).toBeVisible();
  });

  test("SDD-03: Restricted API with an auth URL exposes the 'Pedir acesso' CTA", async ({
    page,
    request,
  }) => {
    const list = await fetchPublicDataservices(request);
    const target = list.find((ds) => ds.authorization_request_url);
    test.skip(!target, "No dataservice with an authorization request URL");
    await gotoDetail(page, target!.slug);

    const cta = page.getByRole("button", { name: /Pedir acesso/i }).first();
    await expect(cta).toBeVisible({ timeout: 10000 });
    await expect(cta).toBeEnabled();
  });

  test("SDD-04: Technical box renders only when there is technical content", async ({
    page,
    request,
  }) => {
    const list = await fetchPublicDataservices(request);
    const heading = page.getByText("Características técnicas").first();

    const withTech = list.find(hasTechnical);
    if (withTech) {
      await gotoDetail(page, withTech.slug);
      await expect(heading).toBeVisible({ timeout: 10000 });
    }

    const withoutTech = list.find((ds) => !hasTechnical(ds));
    if (withoutTech) {
      await gotoDetail(page, withoutTech.slug);
      // The box (and its heading) must be absent when there is nothing to show.
      await expect(heading).toHaveCount(0);
    }

    test.skip(!withTech && !withoutTech, "No public dataservices in the database");
  });

  test("SDD-05: Metrics boxes still render after the sidebar refactor", async ({
    page,
    request,
  }) => {
    const list = await fetchPublicDataservices(request);
    test.skip(list.length === 0, "No public dataservices in the database");
    await gotoDetail(page, list[0].slug);

    await expect(page.getByText("Visualizações").first()).toBeVisible();
    await expect(page.getByText("Favoritos").first()).toBeVisible();
  });
});
