import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load test credentials from .env.test (never committed to git)
dotenvConfig({ path: path.resolve(process.cwd(), '.env.test'), override: true });

/**
 * Playwright E2E Configuration — Cosumar Stock Management App
 * ============================================================
 * Base URL : http://localhost:8080  (Vite dev server port)
 * Auth     : storageState saved once, reused across tests
 * Workers  : 1 in CI (no port conflicts), 2 locally
 */
export default defineConfig({
  testDir: './tests',

  /* Run each test file in isolation */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry once on CI to absorb flakiness */
  retries: process.env.CI ? 1 : 0,

  /* Use 1 worker on CI, 2 locally */
  workers: process.env.CI ? 1 : 2,

  /* Reporter: HTML for local dev, line for CI */
  reporter: process.env.CI ? 'line' : 'html',

  use: {
    /* Base URL = Vite dev server */
    baseURL: 'http://localhost:8080',

    /* Collect traces on failure for debugging */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Increase default timeout to handle Supabase cold starts */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    /* Always run in headed mode locally unless CI */
    headless: !!process.env.CI,

    /* Locale */
    locale: 'fr-FR',
    timezoneId: 'Africa/Casablanca',
  },

  projects: [
    /* ── 1. SETUP: authenticate admin once and save state ── */
    {
      name: 'setup-admin',
      testMatch: '**/auth.setup.ts',
    },
    /* ── 2. SETUP: authenticate client once and save state ── */
    {
      name: 'setup-client',
      testMatch: '**/client-auth.setup.ts',
    },

    /* ── 3. ADMIN tests — depend on admin setup ── */
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup-admin'],
      testMatch: '**/admin/**/*.spec.ts',
    },

    /* ── 4. CLIENT tests — depend on client setup ── */
    {
      name: 'client-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/client.json',
      },
      dependencies: ['setup-client'],
      testMatch: '**/client/**/*.spec.ts',
    },

    /* ── 5. AUTH tests (unauthenticated) ── */
    {
      name: 'auth-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/auth/**/*.spec.ts',
    },
  ],

  /* Start Vite dev server automatically before tests */
  webServer: {
    command: 'npx vite --port 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
