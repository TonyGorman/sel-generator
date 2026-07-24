import { expect, test } from '@playwright/test';
import { selectMiniVariant } from './e2eHelpers';

test.describe('Label Generator regressions - Aisle Labels flow', () => {

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
});
