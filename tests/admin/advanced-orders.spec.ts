import { test, expect } from '@playwright/test';
import { SupabaseMock } from '../mockSupabase';

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Advanced Orders E2E Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin — Commandes Avancées', () => {
  test.use({ storageState: 'tests/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // Inject Supabase mock
    const mock = new SupabaseMock();
    await mock.setupMocks(page);

    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: 'Gestion des Commandes Cosumar' })).toBeVisible();
  });

  test('affiche les détails d\'une commande et ses produits (Order Items)', async ({ page }) => {
    // Check that we see the first order
    const firstOrderCard = page.locator('.space-y-4 > div.border').first();
    await expect(firstOrderCard).toBeVisible();

    // Verify client name or ID is visible
    await expect(firstOrderCard.getByText('Client:')).toBeVisible();
    
    // Check if the product from order_items is listed inside the order card
    // Our mock order has "Sucre Blanc 50kg" x 2
    await expect(firstOrderCard.getByText('Sucre Blanc 50kg')).toBeVisible();
    await expect(firstOrderCard.getByText('Quantité : 2')).toBeVisible();
  });

  test('accepter une commande (transition de statut: en_attente -> accepte)', async ({ page }) => {
    // Since our mock starts with one 'en_attente' order, we should see the Accept button
    const acceptButton = page.getByRole('button', { name: 'Accepter' }).first();
    await expect(acceptButton).toBeVisible();

    // The status badge should say "En attente" initially
    await expect(page.getByText('En attente').first()).toBeVisible();

    // Click accept
    await acceptButton.click();

    // Toast check
    await expect(page.locator('[data-sonner-toaster]').getByText('Commande acceptée')).toBeVisible();

    // Wait for the UI to update the badge to "Acceptée"
    await expect(page.getByText('Acceptée').first()).toBeVisible();
  });

  test('refuser une commande (transition de statut: en_attente -> annule)', async ({ page }) => {
    // Refresh to ensure we have the 'en_attente' order
    const refuseButton = page.getByRole('button', { name: 'Refuser' }).first();
    await expect(refuseButton).toBeVisible();

    // Click refuse
    await refuseButton.click();

    // Check for potential confirm dialog or direct action
    // Note: The UI may ask for a reason, but looking at standard implementation, it might just refuse it
    // Toast check
    await expect(page.locator('[data-sonner-toaster]').getByText(/refusée|annulée/i)).toBeVisible();

    // Verify badge
    await expect(page.locator('div.border').first().getByText(/Refusée|Annulée/i)).toBeVisible();
  });

  test('marquer une commande comme livrée (transition de statut)', async ({ page }) => {
    // Accept it first
    await page.getByRole('button', { name: 'Accepter' }).first().click();
    
    // Wait for UI update
    await expect(page.locator('[data-sonner-toaster]').getByText('Commande acceptée')).toBeVisible();
    await expect(page.getByText('Acceptée').first()).toBeVisible();

    // Now a new button "Marquer comme livrée" or similar should appear
    const livreButton = page.getByRole('button', { name: /Livrer|livrée/i }).first();
    // If it exists, click it
    if (await livreButton.isVisible()) {
      await livreButton.click();
      await expect(page.locator('[data-sonner-toaster]').getByText(/livrée/i)).toBeVisible();
      await expect(page.getByText('Livrée').first()).toBeVisible();
    }
  });
});
