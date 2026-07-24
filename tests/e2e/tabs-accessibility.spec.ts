import { expect, test } from '@playwright/test';

test.describe('Label Generator regressions - tabs accessibility', () => {

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

  test('Large SEL mode is available from both Aisle and Specific Labels tabs', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await expect(page.getByRole('radio', { name: 'Large SEL' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Mini SEL' })).toBeVisible();

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await expect(page.getByRole('radio', { name: 'Large SEL' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Mini SEL' })).toBeVisible();
  });
});
