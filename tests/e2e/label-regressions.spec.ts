import { expect, test, type Page } from '@playwright/test';
import {SHORT_CODE_PREFIXES} from './testConstants';

const selectMiniVariant = async (page: Page, variant: 'mini-three-row' | 'mini-shelf-emphasis'): Promise<void> => {
  await page.getByLabel('Mini Variant').selectOption(variant);
};

test.describe('Label Generator regressions', () => {

  test('loads and shows primary tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('tab', { name: 'Specific Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Aisle Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'FOS/Bak Labels' })).toBeVisible();
  });

  test('supports keyboard navigation across tabs', async ({ page }) => {
    await page.goto('/');

    const specificTab = page.getByRole('tab', { name: 'Specific Labels' });
    const aisleTab = page.getByRole('tab', { name: 'Aisle Labels' });
    const backTab = page.getByRole('tab', { name: 'FOS/Bak Labels' });

    await specificTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(aisleTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowRight');
    await expect(backTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expect(specificTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Specific Labels tab shows validation message for empty submission', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter at least one label value.');
  });


  test('Specific Labels accepts compact input and rejects non-compact formats', async ({ page }) => {
    await page.goto('/');

    const compactInput = [
      '01L01A',
      `${SHORT_CODE_PREFIXES[0]}01A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(compactInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    await expect(page.getByText('01L01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[0]}01A`, { exact: true }).first()).toBeVisible();

    // Separated and spaced inputs are rejected
    await page.getByPlaceholder('Enter labels').fill('01-L01-A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toHaveCount(1);

    await page.getByPlaceholder('Enter labels').fill('01 L01 A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toHaveCount(1);
  });

  test('Specific Labels accepts both Back and Front Of Store compact short code prefixes', async ({ page }) => {
    await page.goto('/');

    const mixedShortCodeInput = [
      `${SHORT_CODE_PREFIXES[0]}01A`,
      `${SHORT_CODE_PREFIXES[1]}01A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(mixedShortCodeInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[0]}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01A`, { exact: true }).first()).toBeVisible();
  });

  test('Back tab shows validation message for missing values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and select an end shelf.');
  });

  test('Back/FOS tab short code type selector generates Front Of Store compact codes', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('radio', { name: 'FOS' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('B');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01B`, { exact: true }).first()).toBeVisible();
  });

  test('Aisle Labels generation updates the summary and invokes print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __printCalls?: number }).__printCalls = 0;
      window.print = () => {
        (window as typeof window & { __printCalls?: number }).__printCalls = ((window as typeof window & { __printCalls?: number }).__printCalls ?? 0) + 1;
      };
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');

    await expect(page.getByText('Total labels: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    await page.getByRole('button', { name: 'Print Labels' }).click();
    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1);
  });

  test('Mini SEL default route renders three-row layout for aisle values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('01', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('L01', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('A', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('01 L01 A', { exact: true })).toHaveCount(0);
  });

  test('Mini SEL shelf-emphasis layout renders shelf and full spaced value lines', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('A', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('01 L01 A', { exact: true })).toBeVisible();
  });

  test('Mini variant selection persists across reload', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.reload();

    await expect(page.getByLabel('Mini Variant')).toHaveValue('mini-shelf-emphasis');
  });

  test('Mini shelf-emphasis falls back for special named values', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill('KIOSK,FLORAL');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('KIOSK', { exact: true }).first()).toBeVisible();
    await expect(firstLabelTile.locator('[class*="miniShelfFullValue"]')).toHaveCount(0);
  });


  test('Large SEL mode is available from both Aisle and Specific Labels tabs', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await expect(page.getByRole('radio', { name: 'Large SEL' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Mini SEL' })).toBeVisible();

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await expect(page.getByRole('radio', { name: 'Large SEL' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Mini SEL' })).toBeVisible();
  });

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
