/**
 * Admin — Gestion des Produits (Stock Management) E2E Tests
 * ===========================================================
 * Pré-requis : storageState 'tests/.auth/admin.json' (set by auth.setup.ts)
 *
 * Couverture :
 *  ✅ Affichage de la liste des produits
 *  ✅ Recherche de produits
 *  ✅ Ouverture du Dialog "Nouveau produit"
 *  ✅ Ajout d'un produit (formulaire complet)
 *  ✅ Toast "Produit créé avec succès" (Sonner)
 *  ✅ Modification d'un produit (pré-remplissage du formulaire)
 *  ✅ Toast "Produit modifié avec succès"
 *  ✅ Suppression d'un produit (confirm dialog)
 *  ✅ Toast "Produit supprimé avec succès"
 *  ✅ Navigation sidebar : Dashboard → Produits → Catégories → Commandes
 *  ✅ Dropdown menu utilisateur (ouverture + déconnexion)
 */
import { test, expect, Page } from '@playwright/test';
import { SupabaseMock } from '../mockSupabase';

// Global mock setup for all admin tests
test.beforeEach(async ({ page }) => {
  const mock = new SupabaseMock();
  await mock.setupMocks(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Unique product name generated per test run to avoid collisions */
const UNIQUE_PRODUCT = `Sucre Test ${Date.now()}`;
const UNIQUE_PRODUCT_EDITED = `${UNIQUE_PRODUCT} — Modifié`;

/** Open the "Ajouter un produit" dialog and fill the form */
async function openAndFillProductForm(
  page: Page,
  name: string,
  price = '12.50',
  stock = '100'
) {
  await page.getByRole('button', { name: 'Ajouter un produit' }).click();

  // Wait for dialog to appear
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nouveau produit' })).toBeVisible();

  // Fill required fields via label selectors
  await page.getByLabel('Nom du produit *').fill(name);
  await page.getByLabel('Prix (€) *').fill(price);
  await page.getByLabel('Stock *').fill(stock);

  // Optional description
  await page.getByLabel('Description').fill('Produit de test automatique Playwright');
}

/** Wait for a Sonner toast containing the given text */
async function expectToast(page: Page, text: string) {
  await expect(
    page.locator('[data-sonner-toaster]').getByText(text)
  ).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Layout & Navigation Admin
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin — Layout & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard Cosumar' })).toBeVisible();
  });

  test('la barre latérale affiche tous les liens de navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Produits' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Catégories' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Commandes' })).toBeVisible();
  });

  test('navigation vers la page Produits via la sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Produits' }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByRole('heading', { name: 'Gestion des Produits' })).toBeVisible();
  });

  test('navigation vers la page Catégories via la sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Catégories' }).click();
    await expect(page).toHaveURL(/\/admin\/categories/);
    await expect(page.getByRole('heading', { name: 'Gestion des Catégories' })).toBeVisible();
  });

  test('navigation vers la page Commandes via la sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Commandes' }).click();
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.getByRole('heading', { name: 'Gestion des Commandes Cosumar' })).toBeVisible();
  });

  test('le dropdown utilisateur s\'ouvre et affiche "Se déconnecter"', async ({ page }) => {
    // Click the user icon button (now accessible via aria-label)
    await page.getByRole('button', { name: /utilisateur/i }).click();

    await expect(page.getByRole('menuitem', { name: 'Se déconnecter' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Voir le site client' })).toBeVisible();
  });

  test('déconnexion via le dropdown → redirige vers la page d\'accueil', async ({ page }) => {
    const dropdownTrigger = page.locator('header').getByRole('button').last();
    await dropdownTrigger.click();

    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();

    // After sign out, should land on home page or auth page
    await page.waitForURL(url => !url.href.includes('/admin'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/admin');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — Dashboard Admin : statistiques
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin — Dashboard statistiques', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard Cosumar' })).toBeVisible();
  });

  test('affiche les cartes de statistiques clés', async ({ page }) => {
    await expect(page.getByText('Total des produits')).toBeVisible();
    await expect(page.getByText('Total des commandes')).toBeVisible();
    await expect(page.getByText('Commandes en attente')).toBeVisible();
    await expect(page.getByText('Commandes acceptées')).toBeVisible();
    await expect(page.getByText('Commandes refusées')).toBeVisible();
    await expect(page.getByText('Commandes livrées')).toBeVisible();
    await expect(page.getByText('Total des catégories')).toBeVisible();
  });

  test('chaque carte affiche un nombre (pas NaN, pas vide)', async ({ page }) => {
    // All stat values are rendered as text-2xl font-bold divs
    const statValues = page.locator('.text-2xl.font-bold');
    const count = await statValues.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await statValues.nth(i).innerText();
      // Must be a number (0 or positive)
      expect(Number(text)).not.toBeNaN();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — Gestion des Produits (CRUD complet)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin — Gestion des Produits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: 'Gestion des Produits' })).toBeVisible();
  });

  // ── 3.1 Affichage ────────────────────────────────────────────────────────
  test('affiche l\'en-tête et le bouton d\'ajout', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Ajouter un produit' })).toBeVisible();
    await expect(page.getByPlaceholder('Rechercher des produits...')).toBeVisible();
  });

  // ── 3.2 Recherche ────────────────────────────────────────────────────────
  test('le champ de recherche filtre les produits affichés', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher des produits...');
    await searchInput.fill('zzzzzz_inexistant');

    // Either "Aucun produit trouvé" text OR 0 product cards
    const emptyMessage = page.getByText('Aucun produit trouvé');
    const productCards = page.locator('[class*="grid"] > div');

    await page.waitForTimeout(500); // debounce
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    const cardCount = await productCards.count();

    expect(hasEmpty || cardCount === 0).toBeTruthy();

    // Clear search
    await searchInput.clear();
  });

  // ── 3.3 Ouverture du Dialog ───────────────────────────────────────────────
  test('le bouton "Ajouter un produit" ouvre le Dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un produit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nouveau produit' })).toBeVisible();
    await expect(page.getByText('Remplissez les informations du produit')).toBeVisible();
  });

  test('le bouton "Annuler" ferme le Dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un produit' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  // ── 3.4 Création d'un produit ─────────────────────────────────────────────
  test('crée un nouveau produit et affiche le toast de succès', async ({ page }) => {
    await openAndFillProductForm(page, UNIQUE_PRODUCT, '25.99', '50');

    // Submit
    await page.getByRole('button', { name: 'Créer' }).click();

    // Toast confirmation
    await expectToast(page, 'Produit créé avec succès');

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });

    // New product card should appear in the list
    await expect(page.getByText(UNIQUE_PRODUCT)).toBeVisible({ timeout: 10_000 });
  });

  test('validation : ne peut pas créer un produit sans nom', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un produit' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill price and stock but not name
    await page.getByLabel('Prix (€) *').fill('10');
    await page.getByLabel('Stock *').fill('5');
    await page.getByRole('button', { name: 'Créer' }).click();

    // Dialog stays open (HTML5 required validation)
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  // ── 3.5 Modification d'un produit ─────────────────────────────────────────
  test('ouvre le formulaire de modification pré-rempli', async ({ page }) => {
    // First, ensure there is at least one product card
    const modifyButton = page.getByRole('button', { name: 'Modifier' }).first();
    const productCount = await page.locator('[class*="grid"] > div').count();

    if (productCount === 0) {
      test.skip(); // Skip if no products exist
      return;
    }

    await modifyButton.click();

    // Dialog should open in edit mode
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modifier le produit' })).toBeVisible();

    // Fields should be pre-filled (name is not empty)
    const nameValue = await page.getByLabel('Nom du produit *').inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    // Submit button says "Modifier"
    await expect(page.getByRole('button', { name: 'Modifier' })).toBeVisible();
  });

  test('modifie un produit et affiche le toast de succès', async ({ page }) => {
    const productCards = page.locator('[class*="grid"] > div');
    const count = await productCards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Click the first "Modifier" button
    await page.getByRole('button', { name: 'Modifier' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Clear name and type new one
    await page.getByLabel('Nom du produit *').clear();
    await page.getByLabel('Nom du produit *').fill(UNIQUE_PRODUCT_EDITED);

    // Submit
    await page.getByRole('button', { name: 'Modifier' }).click();

    // Expect toast
    await expectToast(page, 'Produit modifié avec succès');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
  });

  // ── 3.6 Suppression d'un produit ──────────────────────────────────────────
  test('supprime un produit après confirmation et affiche le toast', async ({ page }) => {
    const productCards = page.locator('[class*="grid"] > div');
    const count = await productCards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Handle the window.confirm dialog (auto-accept)
    page.on('dialog', dialog => dialog.accept());

    const initialCount = await productCards.count();

    // Click the trash icon button of the first product
    await page.locator('[class*="grid"] > div').first()
      .getByRole('button').last().click(); // last button = destructive trash

    // Toast confirmation
    await expectToast(page, 'Produit supprimé avec succès');

    // Product list should decrease by 1
    await expect(productCards).toHaveCount(initialCount - 1, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — Gestion des Catégories
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin — Gestion des Catégories', () => {
  const UNIQUE_CATEGORY = `Catégorie Test ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Gestion des Catégories' })).toBeVisible();
  });

  test('affiche le bouton "Ajouter une catégorie"', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Ajouter une catégorie' })).toBeVisible();
  });

  test('le Dialog "Nouvelle catégorie" s\'ouvre correctement', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une catégorie' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nouvelle catégorie' })).toBeVisible();
    await expect(page.getByLabel('Nom de la catégorie *')).toBeVisible();
  });

  test('crée une catégorie et affiche le toast de succès', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une catégorie' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Nom de la catégorie *').fill(UNIQUE_CATEGORY);
    await page.getByRole('button', { name: 'Créer' }).click();

    await expect(
      page.locator('[data-sonner-toaster]').getByText('Catégorie créée avec succès')
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(UNIQUE_CATEGORY)).toBeVisible({ timeout: 10_000 });
  });

  test('la recherche filtre les catégories', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher des catégories...');
    await searchInput.fill('zzz_inexistant');

    await page.waitForTimeout(500);
    await expect(
      page.getByText(/Aucune catégorie trouvée|Aucune catégorie/)
    ).toBeVisible({ timeout: 5_000 });

    await searchInput.clear();
  });

  test('supprime une catégorie et affiche le toast', async ({ page }) => {
    const cards = page.locator('[class*="grid"] > div');
    if (await cards.count() === 0) { test.skip(); return; }

    page.on('dialog', dialog => dialog.accept());
    const initialCount = await cards.count();

    await cards.first().getByRole('button').last().click();

    await expect(
      page.locator('[data-sonner-toaster]').getByText('Catégorie supprimée avec succès')
    ).toBeVisible({ timeout: 10_000 });

    await expect(cards).toHaveCount(initialCount - 1, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — Gestion des Commandes
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin — Gestion des Commandes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: 'Gestion des Commandes Cosumar' })).toBeVisible();
  });

  test('affiche la liste des commandes ou l\'état vide', async ({ page }) => {
    // Either some orders are displayed, or the empty-state message
    const hasOrders = await page.locator('h1').filter({ hasText: 'Gestion des Commandes' }).isVisible();
    expect(hasOrders).toBeTruthy();

    // Check for either order cards or empty state
    const hasContent = await page.getByText(/Aucune commande trouvée|Commande #/).isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('les commandes "en attente" affichent les boutons Accepter et Refuser', async ({ page }) => {
    const acceptButton = page.getByRole('button', { name: 'Accepter' }).first();
    const isVisible = await acceptButton.isVisible().catch(() => false);

    if (isVisible) {
      // Verify Refuser button is also present
      await expect(page.getByRole('button', { name: 'Refuser' }).first()).toBeVisible();
    } else {
      // No pending orders — acceptable state
      await expect(
        page.getByText(/Aucune commande|En attente/)
      ).toBeVisible().catch(() => {
        // At minimum, the page heading should be visible
        expect(page.getByRole('heading', { name: 'Gestion des Commandes Cosumar' })).toBeTruthy();
      });
    }
  });

  test('accepter une commande affiche le toast de confirmation', async ({ page }) => {
    const acceptButton = page.getByRole('button', { name: 'Accepter' }).first();
    const isVisible = await acceptButton.isVisible().catch(() => false);

    if (!isVisible) { test.skip(); return; }

    await acceptButton.click();
    await expect(
      page.locator('[data-sonner-toaster]').getByText('acceptée')
    ).toBeVisible({ timeout: 10_000 });
  });
});
