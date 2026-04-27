import { test, expect, Page } from '@playwright/test';
import { SupabaseMock } from '../mockSupabase';

// ─────────────────────────────────────────────────────────────────────────────
// Client — Cart & Checkout E2E Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Client — Panier & Checkout', () => {
  // Use the pre-authenticated client state
  test.use({ storageState: 'tests/.auth/client.json' });

  test.beforeEach(async ({ page }) => {
    // Inject Supabase mock
    const mock = new SupabaseMock();
    await mock.setupMocks(page);

    await page.goto('/client/dashboard');
    await expect(page.getByRole('heading', { name: 'Bienvenue chez Cosumar !' })).toBeVisible();
  });

  test('ajouter un produit au panier et naviguer vers le panier', async ({ page }) => {
    // Click "Ajouter"
    const addToCartButton = page.getByRole('button', { name: 'Ajouter' }).first();
    await addToCartButton.click();

    // Verify toast
    await expect(page.locator('[data-sonner-toaster]').getByText(/ajouté au panier/i)).toBeVisible();

    // Verify cart badge increments
    const cartBadge = page.locator('header').getByText('1').first();
    await expect(cartBadge).toBeVisible();

    // Navigate to Cart directly to avoid header flakiness
    await page.goto('/client/cart');
    await expect(page.getByRole('heading', { name: 'Mon Panier' })).toBeVisible();

    // Verify product is in cart list
    await expect(page.getByText('Sucre Blanc 50kg')).toBeVisible();
    await expect(page.getByText('Sous-total (1 articles)')).toBeVisible();
  });

  test('modification de quantité dans le panier met à jour le total', async ({ page }) => {
    // Add product to cart first
    await page.getByRole('button', { name: 'Ajouter' }).first().click();
    
    // Go to cart
    await page.goto('/client/cart');
    await expect(page.getByRole('heading', { name: 'Mon Panier' })).toBeVisible();

    // Verify initial total (45.00 €)
    await expect(page.getByText('45.00 €').first()).toBeVisible();

    // Find the input for quantity
    const quantityInput = page.locator('input[type="number"]');
    await expect(quantityInput).toHaveValue('1');

    // Click the "+" button
    // It's an icon button, we can find it by looking for the plus icon
    // It's the button AFTER the input. The input is between - and +.
    // We can also just use the input directly.
    await quantityInput.fill('3');
    // Blur to trigger update if needed or just wait for react
    await page.keyboard.press('Tab');

    // The subtotal should now be 135.00 €
    await expect(page.getByText('135.00 €').first()).toBeVisible();
    await expect(page.getByText('Sous-total (3 articles)')).toBeVisible();
  });

  test('validation du panier (Checkout) et redirection facture', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Ajouter' }).first().click();
    
    // Go to cart
    await page.goto('/client/cart');
    
    // Verify checkout button is present
    const checkoutBtn = page.getByRole('button', { name: 'Passer commande' });
    await expect(checkoutBtn).toBeVisible();

    // Checkout
    await checkoutBtn.click();

    // Verify redirection to invoice page
    await page.waitForURL(/\/client\/invoice\/.+/);
    await expect(page.getByRole('heading', { name: 'Facture de Commande' })).toBeVisible();

    // Verify success toast
    await expect(page.locator('[data-sonner-toaster]').getByText('Commande passée avec succès !')).toBeVisible();

    // Verify cart is empty after successful checkout
    await page.goto('/client/cart');
    await expect(page.getByText('Votre panier est vide')).toBeVisible();
  });

  test('suppression d\'un produit du panier', async ({ page }) => {
    // Add product
    await page.getByRole('button', { name: 'Ajouter' }).first().click();
    await page.goto('/client/cart');
    
    // Check product is there
    await expect(page.getByText('Sucre Blanc 50kg')).toBeVisible();

    // Click trash icon (destructive button)
    await page.locator('button.text-destructive').first().click();

    // Verify cart is empty
    await expect(page.getByText('Votre panier est vide')).toBeVisible();
  });
});
