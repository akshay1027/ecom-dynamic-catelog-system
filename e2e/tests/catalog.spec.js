// @ts-check
const { test, expect } = require('@playwright/test');

// Catalog page E2E tests.
// All assertions use real selectors derived from the component structure — no
// data-testid attributes exist; we rely on CSS classes, roles, and text content
// that the components actually render.

test.describe('Catalog page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // 1. Homepage loads and shows product cards (at least 1 card visible)
  test('homepage loads and shows product cards', async ({ page }) => {
    // Wait for loading to finish — ProductList renders .product-list when data arrives
    await expect(page.locator('.product-list')).toBeVisible();

    // There should be at least one product card
    const cards = page.locator('.product-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // The page heading must be present
    await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
  });

  // 2. Searching by product name narrows results
  test('searching by product name narrows results', async ({ page }) => {
    // Wait for initial render
    await expect(page.locator('.product-card').first()).toBeVisible();
    const initialCount = await page.locator('.product-card').count();

    // Type a search term that matches exactly one seed product
    const searchInput = page.locator('input[placeholder="Search products..."]');
    await searchInput.fill('ProBook 14 Laptop');

    // Wait for debounced re-fetch — expect fewer cards
    await expect(page.locator('.product-card')).toHaveCount(1, { timeout: 5_000 });

    // The visible card should contain the searched name
    await expect(page.locator('.product-card__name')).toHaveText('ProBook 14 Laptop');

    // Clearing the search restores at least the original count
    await searchInput.clear();
    await expect(page.locator('.product-card')).toHaveCount(initialCount, { timeout: 5_000 });
  });

  // 3. Category filter reduces visible products
  test('category filter reduces visible products', async ({ page }) => {
    // Wait for cards to appear
    await expect(page.locator('.product-card').first()).toBeVisible();
    const initialCount = await page.locator('.product-card').count();

    // Select the "electronics" category
    const categorySelect = page.locator('select#category-select');
    await categorySelect.selectOption('electronics');

    // Product count must be less than the unfiltered total
    await expect(async () => {
      const filtered = await page.locator('.product-card').count();
      expect(filtered).toBeLessThan(initialCount);
      expect(filtered).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 5_000 });

    // Every visible card's meta text should contain "electronics"
    const metas = page.locator('.product-card__meta');
    const metaCount = await metas.count();
    for (let i = 0; i < metaCount; i++) {
      await expect(metas.nth(i)).toContainText('electronics');
    }
  });

  // 4. Clicking a product card opens the product detail view
  test('clicking a product card opens the product detail view', async ({ page }) => {
    // Wait for at least one card
    await expect(page.locator('.product-card').first()).toBeVisible();

    // Grab the name of the first card before clicking
    const firstCardName = await page.locator('.product-card__name').first().textContent();

    // Click the first card
    await page.locator('.product-card').first().click();

    // The detail overlay must appear
    await expect(page.locator('.product-detail-overlay')).toBeVisible();

    // The detail panel shows the same product name
    await expect(page.locator('.product-detail__name')).toHaveText(firstCardName ?? '');

    // Close via the × button
    await page.locator('button[aria-label="Close"]').click();
    await expect(page.locator('.product-detail-overlay')).not.toBeVisible();
  });

  // 5. Attribute filter (by colour/color) narrows results
  test('attribute filter by brand narrows results', async ({ page }) => {
    // Wait for cards
    await expect(page.locator('.product-card').first()).toBeVisible();
    const totalBefore = await page.locator('.product-card').count();

    // Select a category first so the attribute schema loads (apparel has colour/color)
    await page.locator('select#category-select').selectOption('apparel');
    await expect(async () => {
      expect(await page.locator('.product-card').count()).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 5_000 });

    // Wait for the Attributes section to appear (AttributeFilters renders .attr-filters)
    await expect(page.locator('.attr-filters')).toBeVisible({ timeout: 5_000 });

    // Find the first string-type checkbox and check it
    const firstCheckbox = page.locator('.attr-checkbox-item input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Results should be fewer than the full unfiltered list
    await expect(async () => {
      const after = await page.locator('.product-card').count();
      expect(after).toBeLessThan(totalBefore);
    }).toPass({ timeout: 5_000 });
  });

  // 6. A product with variants shows variant pills (size chips on the card)
  test('a product with variants shows variant pills on the card', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('.product-card').first()).toBeVisible();

    // All seed apparel products have size variants — filter to apparel to be deterministic
    await page.locator('select#category-select').selectOption('apparel');
    await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 5_000 });

    // At least one card should contain size chips
    const sizeChips = page.locator('.size-chip');
    await expect(sizeChips.first()).toBeVisible({ timeout: 5_000 });

    // Clicking an apparel card opens the detail view with variant pills
    await page.locator('.product-card').first().click();
    await expect(page.locator('.product-detail-overlay')).toBeVisible();
    await expect(page.locator('.variant-pill').first()).toBeVisible();
  });
});
