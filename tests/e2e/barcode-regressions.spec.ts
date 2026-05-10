import { expect, test } from '@playwright/test';

test.describe('Barcode Generator regressions', () => {
  test('loads and shows primary tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab', { name: 'Specific barcode' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Aisle barcode' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Back barcode' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Configuration' })).toBeVisible();
  });

  test('Aisle configuration link navigates to configuration tab', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();
    await page.getByRole('link', { name: 'configuration section' }).click();

    await expect(page.getByRole('heading', { name: 'Label Configuration' })).toBeVisible();
  });

  test('Specific barcode tab shows validation message for empty submission', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific barcode' }).click();
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter at least one barcode value.');
  });

  test('Specific barcode generation downloads a PDF export', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Enter barcodes').fill('01L01A,BAK01A');
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('button', { name: 'Print Barcodes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download Barcodes' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Barcodes' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('barcodes.pdf');
  });

  test('BAK tab shows validation message for missing values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Back barcode' }).click();
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and shelves using whole numbers.');
  });

  test('Aisle barcode generation updates the summary and invokes print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __printCalls?: number }).__printCalls = 0;
      window.print = () => {
        (window as typeof window & { __printCalls?: number }).__printCalls = ((window as typeof window & { __printCalls?: number }).__printCalls ?? 0) + 1;
      };
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();

    const visibleInputs = page.locator('input:visible');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await visibleInputs.nth(10).fill('1');

    await expect(page.getByText('Total labels: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Barcodes' }).click();
    await expect(page.getByRole('button', { name: 'Print Barcodes' })).toBeVisible();

    await page.getByRole('button', { name: 'Print Barcodes' }).click();
    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1);
  });
});
