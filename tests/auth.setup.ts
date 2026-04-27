/**
 * ADMIN Authentication Setup
 * ==========================
 * Runs ONCE before the "admin-chromium" project.
 * Saves the authenticated session to tests/.auth/admin.json
 * so every admin test starts already logged in — no repeated logins.
 *
 * Credentials: set via env variables or fallback to dev placeholders.
 *   ADMIN_EMAIL    → your admin account email
 *   ADMIN_PASSWORD → your admin account password
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { SupabaseMock } from './mockSupabase';

const ADMIN_AUTH_FILE = path.join('tests', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Initialize mock
  const mock = new SupabaseMock();
  await mock.setupMocks(page);

  const email = process.env.ADMIN_EMAIL ?? 'admin@cosumar.test';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!';

  // Navigate to the admin auth page
  await page.goto('/auth?admin=true');

  // Wait for the login form to be visible
  await expect(page.getByRole('heading', { name: 'Espace Administrateur' })).toBeVisible();

  // Fill credentials using stable accessibility selectors
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill(password);

  // Submit the form
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Wait for redirect to admin dashboard — confirms auth succeeded
  await page.waitForURL('**/admin/dashboard', { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Dashboard Cosumar' })).toBeVisible();

  // Persist the browser storage (cookies + localStorage) for reuse
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
