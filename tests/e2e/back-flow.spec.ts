import { expect, test } from '@playwright/test';
import { SHORT_CODE_PREFIXES } from './testConstants';

test.describe('Label Generator regressions - Back/FOS Labels flow', () => {

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
});
