import { test, expect } from "playwright/test";
import { loginAsEditor } from "../../../helpers/auth";

/**
 * Backoffice (disposable) — Membership request flow.
 *
 * Covers the fixes for:
 *   - Members being blocked from requesting membership to their own org (409)
 *   - Accepting/refusing pending requests via the admin members page
 *
 * Each test creates a fresh org via the API so state is fully isolated.
 * The disposable test DB is wiped between runs so no teardown is needed.
 */

test.describe("Backoffice (disposable) - Membership requests", () => {
  let orgId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post("/api/1/organizations/", {
      headers: { "Content-Type": "application/json" },
      data: {
        name: `Membership Test Org ${Date.now()}`,
        description: "Temporary org created for membership e2e tests.",
      },
    });
    expect(res.ok()).toBeTruthy();
    const org = await res.json();
    orgId = org.id;
  });

  // ─── MR-D1 ──────────────────────────────────────────────────────────────────

  test("MR-D1: Admin (org creator) cannot submit a membership request to their own org", async ({
    page,
  }) => {
    // The admin created the org in beforeEach → they are already a member.
    // The backend should reject the request with 409.
    const res = await page.request.post(`/api/1/organizations/${orgId}/membership/`, {
      headers: { "Content-Type": "application/json" },
      data: { comment: "I already belong here." },
    });
    expect(res.status()).toBe(409);
  });

  // ─── MR-D2 ──────────────────────────────────────────────────────────────────

  test("MR-D2: Non-member (editor) can submit a membership request", async ({
    browser,
  }) => {
    // Editor is not a member of the freshly created org, so the request must succeed.
    const editorCtx = await browser.newContext({ storageState: undefined });
    const editorPage = await editorCtx.newPage();
    await loginAsEditor(editorPage);

    const res = await editorPage.request.post(
      `/api/1/organizations/${orgId}/membership/`,
      {
        headers: { "Content-Type": "application/json" },
        data: { comment: "Please accept my request." },
      }
    );
    // 201 Created (new request) or 200 OK (updating an existing pending one).
    expect(res.status()).toBeLessThanOrEqual(201);

    await editorCtx.close();
  });

  // ─── MR-D3 ──────────────────────────────────────────────────────────────────

  test("MR-D3: Admin accepts pending request → request disappears from members page", async ({
    page,
    browser,
  }) => {
    // Editor submits a request via API.
    const editorCtx = await browser.newContext({ storageState: undefined });
    const editorPage = await editorCtx.newPage();
    await loginAsEditor(editorPage);
    const reqRes = await editorPage.request.post(
      `/api/1/organizations/${orgId}/membership/`,
      {
        headers: { "Content-Type": "application/json" },
        data: { comment: "Awaiting acceptance." },
      }
    );
    expect(reqRes.ok()).toBeTruthy();
    await editorCtx.close();

    // Admin navigates to the members page.
    await page.goto(`/admin/org/${orgId}/members`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Pending requests section must be visible with 1 request.
    await expect(
      page.getByText(/Pedidos de adesão pendentes \(1\)/i)
    ).toBeVisible({ timeout: 10000 });

    // Click "Aceitar".
    await page.getByRole("button", { name: /^Aceitar$/i }).first().click();
    await page.waitForTimeout(2000);

    // After acceptance the pending section must be gone.
    await expect(page.getByText(/Pedidos de adesão pendentes/i)).not.toBeVisible({
      timeout: 10000,
    });

    // Confirm via API: the org now has 2 members (admin + editor).
    const orgRes = await page.request.get(`/api/1/organizations/${orgId}/`);
    const org = await orgRes.json();
    expect(org.members?.length).toBe(2);
  });

  // ─── MR-D4 ──────────────────────────────────────────────────────────────────

  test("MR-D4: Admin refuses pending request → modal opens and request is removed", async ({
    page,
    browser,
  }) => {
    // Editor submits a request via API.
    const editorCtx = await browser.newContext({ storageState: undefined });
    const editorPage = await editorCtx.newPage();
    await loginAsEditor(editorPage);
    const reqRes = await editorPage.request.post(
      `/api/1/organizations/${orgId}/membership/`,
      {
        headers: { "Content-Type": "application/json" },
        data: { comment: "Hoping to join." },
      }
    );
    expect(reqRes.ok()).toBeTruthy();
    await editorCtx.close();

    // Admin navigates to the members page.
    await page.goto(`/admin/org/${orgId}/members`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await expect(
      page.getByText(/Pedidos de adesão pendentes \(1\)/i)
    ).toBeVisible({ timeout: 10000 });

    // Click "Recusar" to open the refusal modal.
    await page.getByRole("button", { name: /^Recusar$/i }).first().click();

    // The refusal modal must appear.
    await expect(page.getByText(/Recusar pedido de adesão/i)).toBeVisible({
      timeout: 5000,
    });

    // Confirm the refusal inside the modal.
    const modal = page.locator('[role="dialog"]');
    await modal.getByRole("button", { name: /Recusar/i }).click();
    await page.waitForTimeout(2000);

    // Pending section must be gone after refusal.
    await expect(page.getByText(/Pedidos de adesão pendentes/i)).not.toBeVisible({
      timeout: 10000,
    });

    // Confirm via API: member count is still 1 (only admin).
    const orgRes = await page.request.get(`/api/1/organizations/${orgId}/`);
    const org = await orgRes.json();
    expect(org.members?.length).toBe(1);
  });

  // ─── MR-D5 ──────────────────────────────────────────────────────────────────

  test("MR-D5: Accepting a request does not show an error on the members page", async ({
    page,
    browser,
  }) => {
    // Regression guard: before the fix, accepting a request from an already-member
    // returned 409 and the UI showed no feedback. Now it must return 200 silently.
    const editorCtx = await browser.newContext({ storageState: undefined });
    const editorPage = await editorCtx.newPage();
    await loginAsEditor(editorPage);
    await editorPage.request.post(`/api/1/organizations/${orgId}/membership/`, {
      headers: { "Content-Type": "application/json" },
      data: { comment: "test" },
    });
    await editorCtx.close();

    await page.goto(`/admin/org/${orgId}/members`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: /^Aceitar$/i }).first().click();
    await page.waitForTimeout(2000);

    // No error card must be visible after accept.
    const errorCard = page.locator('[class*="danger"], [class*="critical"], [role="alert"]');
    await expect(errorCard).not.toBeVisible({ timeout: 5000 });
  });
});
