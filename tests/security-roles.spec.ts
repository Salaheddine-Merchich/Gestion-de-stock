import { test, expect } from '@playwright/test';
import { SupabaseMock } from './mockSupabase';

// ─────────────────────────────────────────────────────────────────────────────
// Security & Roles E2E Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sécurité & Rôles', () => {
  
  test.describe('Utilisateur Non Authentifié (Anonyme)', () => {
    // No storageState, so completely anonymous
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      const mock = new SupabaseMock();
      await mock.setupMocks(page);
    });

    test('bloqué d\'accéder à /admin/dashboard -> redirige vers /auth', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForURL(/\/auth/);
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });

    test('bloqué d\'accéder à /client/dashboard -> redirige vers /auth', async ({ page }) => {
      await page.goto('/client/dashboard');
      await page.waitForURL(/\/auth/);
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });
  });

  test.describe('Client Authentifié', () => {
    test.use({ storageState: 'tests/.auth/client.json' });

    test.beforeEach(async ({ page }) => {
      const mock = new SupabaseMock();
      await mock.setupMocks(page);
    });

    test('bloqué d\'accéder aux routes Admin -> redirigé vers son espace ou auth', async ({ page }) => {
      // Direct access attempt
      await page.goto('/admin/dashboard');
      
      // Should NOT stay on /admin/dashboard. It should redirect to /client/dashboard or /auth
      await page.waitForURL(url => !url.href.includes('/admin'));
      expect(page.url()).not.toContain('/admin/dashboard');
    });
  });

  test.describe('Administrateur Authentifié', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    test.beforeEach(async ({ page }) => {
      const mock = new SupabaseMock();
      await mock.setupMocks(page);
    });

    test('bloqué d\'accéder aux routes Client -> redirigé vers son espace', async ({ page }) => {
      // Direct access attempt
      await page.goto('/client/dashboard');
      
      // Should NOT stay on /client/dashboard. It should redirect to /admin/dashboard
      await page.waitForURL(url => !url.href.includes('/client'));
      expect(page.url()).not.toContain('/client/dashboard');
    });
  });

});
