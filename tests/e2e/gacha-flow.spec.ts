import { test, expect, type Page, type Route } from '@playwright/test';

import type { PlayResponse, ResultResponse } from '@/lib/api/gacha';

const RESULT_ID = 'mock-result-id';

const MOCK_CARD = {
  id: '22222222-1111-4111-8111-111111111111',
  name: 'コンビニ夜勤バイト',
  rarity: 'N' as const,
  starLevel: 1,
  imageUrl: '/kenta_cards/card01_convenience.png',
  hasReversal: false,
};

const MOCK_GACHA_RESULT = {
  isLoss: true,
  characterId: 'kenta' as const,
  cardId: 'card01_convenience',
  rarity: 'N' as const,
  starRating: 1,
  cardName: 'コンビニ夜勤バイト',
  cardTitle: '闇のレジ番',
  cardImagePath: '/kenta_cards/card01_convenience.png',
  lossCardImagePath: '/videos/common/loss_card.png',
  isDonden: false,
  isSequel: false,
};

const MOCK_STORY = {
  starLevel: 1,
  hadReversal: false,
  characterId: 'kenta' as const,
  cardId: MOCK_CARD.id,
  preStory: [],
  chance: [],
  mainStory: [],
  reversalStory: [],
  finalCard: {
    id: MOCK_CARD.id,
    card_name: MOCK_CARD.name,
    rarity: MOCK_CARD.rarity,
    star_level: MOCK_CARD.starLevel,
    card_image_url: MOCK_CARD.imageUrl,
    has_reversal: false,
  },
};

const MOCK_CHARACTER = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '健太',
  thumbnailUrl: '/kenta_cards/card01_convenience.png',
  expectationLevel: 2,
};

function fulfillWithJson<T>(route: Route, payload: T) {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function mockGachaApis(page: Page) {
  const playPayload: PlayResponse = {
    success: true,
    ticketBalance: 99,
    session: {
      multiSessionId: null,
      totalPulls: 10,
    },
    pulls: [
      {
        order: 1,
        resultId: RESULT_ID,
        gachaResult: MOCK_GACHA_RESULT,
        character: MOCK_CHARACTER,
        card: MOCK_CARD,
        story: MOCK_STORY,
      },
    ],
  };

  const resultPayload: ResultResponse = {
    success: true,
    resultId: RESULT_ID,
    serialNumber: 1,
    inventoryId: 'mock-inventory-id',
    gachaResult: MOCK_GACHA_RESULT,
    story: MOCK_STORY,
    card: MOCK_CARD,
  };

  await page.route('**/api/gacha/play', (route) => fulfillWithJson(route, playPayload));
  await page.route('**/api/gacha/result', (route) => fulfillWithJson(route, resultPayload));
}

test('来世ガチャを開始してカードリビールまで到達できる', async ({ page }) => {
  await mockGachaApis(page);
  await page.goto('/gacha');

  await page.getByRole('button', { name: 'ガチャを始める' }).click();

  const nextButton = page.getByRole('button', { name: /^NEXT/ });
  await nextButton.waitFor({ state: 'visible' });
  await nextButton.click({ force: true });

  const skipButton = page.getByRole('button', { name: /^SKIP/ });
  await skipButton.click({ force: true });

  await expect(page.getByText('RESULT')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: '転生失敗' })).toBeVisible();
});
