import { test, expect } from "playwright/test";
import { loginAsAdmin } from "../../helpers/auth";

const PROFILE_URL = "/pages/admin/profile";

test.describe("Backoffice - Admin Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(PROFILE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test('AP-01: Profile page loads with "Perfil" h1 heading', async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /^Perfil$/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("AP-02: Four tabs are visible — Perfil, Atividades, Subscrições, Acompanhamentos", async ({
    page,
  }) => {
    await expect(page.getByText(/^Perfil$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^Atividades$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^Subscrições$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^Acompanhamentos$/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('"AP-03: "Ver perfil público" button is visible in the profile card', async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /Ver perfil público/i }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test("AP-04: Perfil tab form contains required fields", async ({ page }) => {
    await expect(page.getByLabel(/Nome/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Último nome/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Biografia/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Site da Internet/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('AP-05: "Guardar" button is present in the Perfil tab', async ({
    page,
  }) => {
    const saveBtn = page.getByRole("button", { name: /^Guardar$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
  });

  test("AP-06: Atividades tab loads without crashing", async ({ page }) => {
    const activitiesTab = page.getByText(/^Atividades$/i).first();
    await activitiesTab.click();
    await page.waitForTimeout(2000);

    // Either a timeline of activities or an empty state should be present
    const hasContent =
      (await page.getByText(/A carregar atividades|Sem atividades/i).count()) > 0 ||
      (await page.locator(".space-y-32, .border-l-2").count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test('AP-07: Subscrições tab shows "Sem subscrições" empty state', async ({
    page,
  }) => {
    const subscriptionsTab = page.getByText(/^Subscrições$/i).first();
    await subscriptionsTab.click();
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/Sem subscrições/i).first();
    await expect(emptyState).toBeVisible({ timeout: 8000 });
  });

  test('AP-08: Acompanhamentos tab shows "Sem acompanhamentos" empty state', async ({
    page,
  }) => {
    const followersTab = page.getByText(/^Acompanhamentos$/i).first();
    await followersTab.click();
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/Sem acompanhamentos/i).first();
    await expect(emptyState).toBeVisible({ timeout: 8000 });
  });

  test('"AP-09: "Ver perfil público" navigates to public profile page', async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /Ver perfil público/i }).first();
    await btn.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/pages/users/");
    const heading = page.getByRole("heading", { name: /^Perfil$/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  // Regression for the "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
  // error on the change-password modal. It guards two coupled bugs at once:
  //   1. Missing /change route handler — the POST fell through to Next.js's 404
  //      HTML page, which failed JSON parsing.
  //   2. The client CSRF fetch minted a fresh anonymous session whose cookie
  //      overwrote the authenticated one, so the change arrived unauthenticated.
  // Submitting a WRONG current password is non-destructive (the password is not
  // changed) yet still exercises the full round trip: it must surface the
  // backend's "Palavra-passe inválida" validation message. A broken route would
  // crash or show a generic error; a destroyed session would show a
  // session-expired message instead.
  test("AP-10: Change-password modal returns the backend error (route + session intact)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Alterar senha/i }).first().click();

    const currentInput = page.locator("#current-password");
    await expect(currentInput).toBeVisible({ timeout: 10000 });
    await currentInput.fill("WrongCurrentPwd123!");
    await page.locator("#new-password").fill("NovaSenhaValida123!");
    await page.locator("#confirm-password").fill("NovaSenhaValida123!");

    await page.getByRole("button", { name: /^Altere a sua senha$/i }).click();

    // The backend rejects the wrong current password; the modal shows that exact
    // message. Crucially NOT a JSON-parse crash, a generic failure, or a false
    // success card.
    await expect(page.getByText(/Palavra-passe inválida/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Senha alterada com sucesso/i)).toHaveCount(0);
  });
});
