/**
 * CLIENT Authentication Setup
 * ============================
 * Runs ONCE before the "client-chromium" project.
 * Saves the authenticated session to tests/.auth/client.json
 *
 * Credentials: set via env variables or fallback to dev placeholders.
 *   CLIENT_EMAIL    → your client account email
 *   CLIENT_PASSWORD → your client account password
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { SupabaseMock } from './mockSupabase';

const CLIENT_AUTH_FILE = path.join('tests', '.auth', 'client.json');

setup('authenticate as client', async ({ page }) => {
  // Initialize mock
  const mock = new SupabaseMock();
  await mock.setupMocks(page);

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('request', req => console.log('REQUEST:', req.method(), req.url()));

  const email = process.env.CLIENT_EMAIL ?? 'client@cosumar.test';
  const password = process.env.CLIENT_PASSWORD ?? 'Client1234!';

  // Navigate to the client auth page
  await page.goto('/auth');

  // Wait for the login form
  await expect(page.getByRole('heading', { name: 'Espace Client' })).toBeVisible();

  // Fill credentials
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill(password);

  // Submit
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Wait for redirect to client dashboard
  await page.waitForURL('**/client/dashboard', { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Bienvenue chez Cosumar !' })).toBeVisible();

  // Save session state
  await page.context().storageState({ path: CLIENT_AUTH_FILE });
});
