import { expect, test } from '@playwright/test';
import { selectMiniVariant } from './e2eHelpers';

test.describe('Label Generator regressions - visual baselines', () => {

  test('Aisle Large SEL preview remains visually stable for one full 8-label page', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1600 });
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await page.getByRole('radio', { name: 'Large SEL' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('2');
    await visibleInputs.nth(4).fill('1');
    await visibleInputs.nth(5).fill('2');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('B');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const labelAppRoot = page.locator('[class*="labelAppRoot"]').first();
    await labelAppRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('aisle-large-sel-8-labels.png', {
      animations: 'disabled',
      // Allow minor cross-platform anti-aliasing/font rasterization drift (macOS vs Linux).
      maxDiffPixelRatio: 0.05,
    });
  });

  test('captures Mini SEL shelf-emphasis aisle preview baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1400 });
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();

    // Generate a range of aisle labels to show shelf-emphasis layout
    const labelValues = [
      '01L01A', '01L02A', '01L03A', '01L04A', '01L05A',
      '02L01A', '02L02A', '02L03A', '02L04A', '02L05A',
      '03L01A', '03L02A', '03L03A', '03L04A', '03L05A',
      '04L01A', '04L02A', '04L03A', '04L04A', '04L05A',
      '05L01A', '05L02A', '05L03A', '05L04A', '05L05A',
      '06L01A', '06L02A', '06L03A', '06L04A', '06L05A',
      '07L01A', '07L02A', '07L03A', '07L04A', '07L05A',
    ].join(',');

    await page.getByPlaceholder('Enter labels').fill(labelValues);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const labelAppRoot = page.locator('[class*="labelAppRoot"]').first();
    await labelAppRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('mini-sel-shelf-emphasis-aisle-preview.png', {
      animations: 'disabled',
      // Allow minor cross-platform anti-aliasing/font rasterization drift (macOS vs Linux).
      maxDiffPixelRatio: 0.05,
    });
  });

  test('captures full preview of 35 labels with shelf-emphasis UI selection', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1400 });
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();

    const labelValues = Array.from({ length: 35 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`).join(',');
    await page.getByPlaceholder('Enter labels').fill(labelValues);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const labelAppRoot = page.locator('[class*="labelAppRoot"]').first();
    await labelAppRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('default-mini-shelf-emphasis-35-labels.png', {
      animations: 'disabled',
      // Allow minor cross-platform anti-aliasing/font rasterization drift (macOS vs Linux).
      maxDiffPixelRatio: 0.05,
    });
  });
});
