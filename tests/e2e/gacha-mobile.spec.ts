import { test, expect } from '@playwright/test';

test('gacha page renders mobile hero and CTA', async ({ page }) => {
  await page.goto('/gacha');

  await expect(page.getByRole('heading', { name: 'ガチャホール' })).toBeVisible();
  await expect(page.getByText('色んな人生に生まれ変わってみたいと願う主人公達')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ガチャを始める' })).toBeVisible();
  await expect(page.getByText('ガチャは１チケットを消費します')).toBeVisible();
});
