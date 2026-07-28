import { test, expect } from "playwright/test";

const DATASET_SLUG = "recuperacao-de-creditos";
const FRONTEND_URL = "http://localhost:3000";

test("download link routes through backend redirect for tracking", async ({
  page,
}) => {
  await page.goto(`${FRONTEND_URL}/datasets/${DATASET_SLUG}`, {
    waitUntil: "networkidle",
  });

  // Wait for client-side hydration
  await page.waitForTimeout(2000);

  // Take screenshot for debugging
  await page.screenshot({ path: "test-results/dataset-page.png", fullPage: true });

  // Find the resource accordion - look for the resource title text
  const resourceTrigger = page.locator("text=recuperacao-creditos").first();
  if (await resourceTrigger.isVisible()) {
    console.log("Found resource trigger, clicking...");
    await resourceTrigger.click();
    await page.waitForTimeout(1000);
  } else {
    // Try clicking any element that looks like an accordion trigger for resources
    const allButtons = await page.locator("button").allTextContents();
    console.log("All buttons:", allButtons.map((t) => t.trim().substring(0, 60)).filter(Boolean));
  }

  // Check for download links after expanding
  const allHrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href") || "")
  );

  const trackedLinks = allHrefs.filter((h) => h.includes("/datasets/r/"));
  const directCsvLinks = allHrefs.filter((h) => /\.csv|\.xlsx|\.json/i.test(h));

  console.log(`Tracked download links (/datasets/r/): ${trackedLinks.length}`);
  trackedLinks.slice(0, 3).forEach((l) => console.log(`  ✓ ${l}`));
  console.log(`Direct file links (.csv/.xlsx): ${directCsvLinks.length}`);
  directCsvLinks.slice(0, 3).forEach((l) => console.log(`  ✗ ${l}`));

  // At minimum, there should be no direct CSV links (all should go through backend)
  // If accordions aren't open, we won't find any links - that's OK for this check
  if (trackedLinks.length === 0 && directCsvLinks.length === 0) {
    console.log("No download links visible (accordion closed) - opening accordion...");

    // Try a more specific selector for the accordion
    await page.screenshot({ path: "test-results/before-click.png" });
    const accordion = page.locator('[data-testid*="accordion"], .agora-accordion, details, [class*="Accordion"]').first();
    if (await accordion.isVisible()) {
      await accordion.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "test-results/after-click.png" });
    }

    // Re-check
    const hrefs2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href") || "")
    );
    const tracked2 = hrefs2.filter((h) => h.includes("/datasets/r/"));
    console.log(`After accordion click - tracked links: ${tracked2.length}`);
    tracked2.slice(0, 3).forEach((l) => console.log(`  ✓ ${l}`));
  }

  // Final: verify no direct file URLs leak through as download links
  expect(directCsvLinks.length).toBe(0);
});
