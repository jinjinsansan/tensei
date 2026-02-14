import { test, expect } from '@playwright/test';

test('gacha page renders mobile hero and CTA', async ({ page }) => {
  await page.goto('/gacha');

  await expect(page.getByRole('heading', { name: '来世ガチャ体験ホール' })).toBeVisible();
  await expect(page.getByText('RAISE GACHA')).toBeVisible();
  await expect(page.getByRole('button', { name: '来世ガチャ' })).toBeVisible();
  await expect(page.getByText('Ticket Balance')).toBeVisible();
  await expect(page.getByText('Flow')).toBeVisible();
});
