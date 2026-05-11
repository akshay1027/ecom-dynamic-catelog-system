// @ts-check
const { test, expect } = require('@playwright/test');

// Admin page E2E tests.
// Selectors are derived from AdminPage.jsx and ProductForm.jsx.
// Each test navigates fresh so tests are independent.

test.describe('Admin page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  // 1. Admin page loads — product list table is visible
  test('admin page loads and shows the product table', async ({ page }) => {
    // The page heading
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    // The product table must appear (seeded data is pre-loaded)
    await expect(page.locator('.product-table')).toBeVisible();

    // At least one row in tbody
    const rows = page.locator('.product-table tbody tr');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  // 2. "+ Add Product" button opens the form dialog
  test('Add Product button opens the form', async ({ page }) => {
    // Wait for page to settle
    await expect(page.locator('.product-table')).toBeVisible();

    await page.getByRole('button', { name: '+ Add Product' }).click();

    // ProductForm renders with role="dialog" and aria-modal="true"
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Title inside the dialog should be "Add Product"
    await expect(dialog.getByRole('heading', { name: 'Add Product' })).toBeVisible();
  });

  // 3. Fill and submit the form — new product appears in the list
  test('creates a new product via the form', async ({ page }) => {
    await expect(page.locator('.product-table')).toBeVisible();
    const rowsBefore = await page.locator('.product-table tbody tr').count();

    // Open the form
    await page.getByRole('button', { name: '+ Add Product' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const uniqueName = `E2E Test Product ${Date.now()}`;

    // Fill required fields using the label-associated input ids from ProductForm.jsx
    await page.locator('#pf-name').fill(uniqueName);
    await page.locator('#pf-description').fill('Created by Playwright E2E test');
    await page.locator('#pf-price').fill('19.99');
    await page.locator('#pf-currency').fill('USD');
    await page.locator('#pf-category').fill('electronics');
    await page.locator('#pf-type').fill('gadget');
    await page.locator('#pf-stock').fill('5');

    // Select first available brand
    const brandSelect = page.locator('#pf-brand');
    const firstBrandValue = await brandSelect.locator('option').nth(1).getAttribute('value');
    await brandSelect.selectOption(firstBrandValue ?? '');

    // Submit
    await page.getByRole('button', { name: 'Save Product' }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // New product row should appear in the table
    await expect(async () => {
      const rowsAfter = await page.locator('.product-table tbody tr').count();
      expect(rowsAfter).toBeGreaterThan(rowsBefore);
    }).toPass({ timeout: 5_000 });

    // The new product name should be visible in the table
    await expect(page.locator('.product-table').getByText(uniqueName)).toBeVisible();
  });

  // 4. Edit a product — form opens pre-populated, changes persist
  test('edits an existing product', async ({ page }) => {
    await expect(page.locator('.product-table tbody tr').first()).toBeVisible();

    // Get the name of the first product before editing
    const firstRowName = await page.locator('.product-table tbody tr td').first().textContent();

    // Click the first Edit button
    await page.locator('.btn-edit').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Form should be pre-populated with the existing product name
    const nameInput = page.locator('#pf-name');
    await expect(nameInput).toHaveValue(firstRowName ?? '');

    // The heading should say "Edit Product"
    await expect(dialog.getByRole('heading', { name: 'Edit Product' })).toBeVisible();

    // Change the description
    const updatedDesc = `Updated by E2E at ${Date.now()}`;
    await page.locator('#pf-description').fill(updatedDesc);

    await page.getByRole('button', { name: 'Save Product' }).click();

    // Dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The product name is still present (we only changed description)
    await expect(page.locator('.product-table').getByText(firstRowName ?? '')).toBeVisible();
  });

  // 5. Delete a product — it is removed from the list
  test('deletes a product from the list', async ({ page }) => {
    await expect(page.locator('.product-table tbody tr').first()).toBeVisible();
    const rowsBefore = await page.locator('.product-table tbody tr').count();

    // Get the name of the product we are about to delete for verification
    const nameToDelete = await page.locator('.product-table tbody tr td').first().textContent();

    // Confirm the browser dialog automatically
    page.once('dialog', dialog => dialog.accept());

    // Click the first Delete button
    await page.locator('.btn-delete').first().click();

    // Row count should decrease by 1
    await expect(async () => {
      const rowsAfter = await page.locator('.product-table tbody tr').count();
      expect(rowsAfter).toBe(rowsBefore - 1);
    }).toPass({ timeout: 5_000 });

    // The deleted product name should no longer appear (may appear in other rows, so check count)
    const matchingCells = page.locator('.product-table tbody tr td:first-child', { hasText: nameToDelete ?? '' });
    // There should be 0 exact-match cells for that first-column name
    await expect(matchingCells).toHaveCount(0, { timeout: 5_000 });
  });

  // 6. Add a variant type + value to a product — variant appears after saving
  test('adds a variant type and value to a product', async ({ page }) => {
    await expect(page.locator('.product-table tbody tr').first()).toBeVisible();

    // Open edit for the first product
    await page.locator('.btn-edit').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click "+ Add Variant Type" — only shown when variantTypes.length === 0
    // If the product already has variants the button says "+ Add Value" per type.
    // To be safe: use a product without variants — scroll down in the table to find
    // a non-apparel product (e.g. furniture/electronics have no variants).
    // We check whether the "+ Add Variant Type" button is visible; if not, close and
    // find the first product without variants (furniture or electronics in the seed).
    const addVariantTypeBtn = dialog.getByRole('button', { name: '+ Add Variant Type' });
    const hasAddVariantTypeBtn = await addVariantTypeBtn.isVisible();

    if (!hasAddVariantTypeBtn) {
      // Close this dialog and find a product without variants
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).not.toBeVisible();

      // Look for the first Edit button in a furniture or electronics row
      // The table has columns: Name | Brand | Category | Price | Stock | Actions
      const rows = page.locator('.product-table tbody tr');
      const rowCount = await rows.count();
      let targetEditBtn = null;
      for (let i = 0; i < rowCount; i++) {
        const categoryCell = rows.nth(i).locator('td').nth(2);
        const cat = await categoryCell.textContent();
        if (cat === 'furniture' || cat === 'electronics') {
          targetEditBtn = rows.nth(i).locator('.btn-edit');
          break;
        }
      }
      if (targetEditBtn) await targetEditBtn.click();
      await expect(dialog).toBeVisible();
    }

    // Now click "+ Add Variant Type"
    const addBtn = dialog.getByRole('button', { name: '+ Add Variant Type' });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Fill in the variant type key
    const variantKeyInput = dialog.locator('input[placeholder="Variant type (e.g. colour, size)"]').last();
    await variantKeyInput.fill('colour');

    // Add a variant value
    await dialog.getByRole('button', { name: '+ Add Value' }).click();

    const variantValueInput = dialog.locator('input[placeholder="Value (e.g. blue)"]').last();
    await variantValueInput.fill('blue');

    const variantStockInput = dialog.locator('input[placeholder="Stock"]').last();
    await variantStockInput.fill('10');

    // Save
    await page.getByRole('button', { name: 'Save Product' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Open the same product again to confirm variant persisted
    await page.locator('.btn-edit').first().click();
    await expect(dialog).toBeVisible();

    // The variant type key input should show "colour"
    await expect(dialog.locator('input[placeholder="Variant type (e.g. colour, size)"]').first()).toHaveValue('colour');
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
