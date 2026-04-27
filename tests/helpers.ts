/**
 * Playwright Test Utilities — Cosumar
 * =====================================
 * Shared helpers used across all test suites.
 */
import { Page, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Sonner Toast helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assert a Sonner toast is visible with the given text.
 * The Sonner toaster container has the attribute [data-sonner-toaster].
 */
export async function expectSuccessToast(page: Page, text: string, timeout = 10_000) {
  await expect(
    page.locator('[data-sonner-toaster]').getByText(text)
  ).toBeVisible({ timeout });
}

/**
 * Assert an error toast is visible.
 */
export async function expectErrorToast(page: Page, text: string, timeout = 10_000) {
  await expect(
    page.locator('[data-sonner-toaster]').getByText(text)
  ).toBeVisible({ timeout });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open a shadcn/ui Dialog by clicking the trigger button with the given name.
 */
export async function openDialog(page: Page, triggerName: string) {
  await page.getByRole('button', { name: triggerName }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
}

/**
 * Close the currently open dialog by clicking "Annuler".
 */
export async function closeDialog(page: Page) {
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Navigate to an admin page and wait for its heading.
 */
export async function goToAdminPage(
  page: Page,
  path: string,
  headingText: string
) {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: headingText })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Open the admin user dropdown menu (top-right User icon).
 */
export async function openAdminDropdown(page: Page) {
  // The User icon button is the last button in the header
  await page.locator('header').getByRole('button').last().click();
  // Verify the menu opened
  await expect(page.getByRole('menu')).toBeVisible({ timeout: 5_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase strategy note
// ─────────────────────────────────────────────────────────────────────────────
// DATA STRATEGY — Supabase
// ========================
// Two approaches are available for these tests:
//
// ① REAL DATABASE (recommended for integration tests):
//    - Use a dedicated Supabase TEST project (separate from production).
//    - Set env variables: SUPABASE_URL_TEST, SUPABASE_ANON_KEY_TEST.
//    - Run a seed script before tests: `bun run tests/seed.ts`
//    - Add cleanup in test teardowns to remove test data.
//
// ② MOCKING (for pure unit/UI tests without Supabase dependency):
//    - Use Playwright's `page.route()` to intercept Supabase REST API calls.
//
// Example of mocking a products GET request:
//
//   await page.route('**/rest/v1/products*', async route => {
//     await route.fulfill({
//       status: 200,
//       contentType: 'application/json',
//       body: JSON.stringify([
//         {
//           id: 'mock-uuid-1',
//           name: 'Sucre Blanc 50kg',
//           price: 45.00,
//           stock: 200,
//           description: 'Sucre raffiné',
//           category_id: null,
//           image_url: null,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         },
//       ]),
//     });
//   });
//
// Example of mocking a Supabase Auth sign-in:
//
//   await page.route('**/auth/v1/token*', async route => {
//     await route.fulfill({
//       status: 200,
//       contentType: 'application/json',
//       body: JSON.stringify({
//         access_token: 'mock-token',
//         token_type: 'bearer',
//         user: { id: 'mock-user-id', email: 'admin@test.com', role: 'authenticated' },
//       }),
//     });
//   });
export const DATA_STRATEGY_DOCS = `See comments in tests/helpers.ts for Supabase mock strategy.`;
