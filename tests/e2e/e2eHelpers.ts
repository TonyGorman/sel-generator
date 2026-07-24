import type { Page } from '@playwright/test';

export const selectMiniVariant = async (
  page: Page,
  variant: 'mini-three-row' | 'mini-shelf-emphasis',
): Promise<void> => {
  await page.getByLabel('Mini Variant').selectOption(variant);
};
