import { expect, test } from '@playwright/test';
import { SHORT_CODE_PREFIXES } from './testConstants';
import { selectMiniVariant } from './e2eHelpers';

test.describe('Label Generator regressions - Specific Labels flow', () => {

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
});
