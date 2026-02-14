import type { Grade, CountdownPattern } from '@/lib/gacha/common/types';

const pattern = (
  id: string,
  name: string,
  steps: CountdownPattern['steps'],
): CountdownPattern => ({ id, name, steps });

export const COUNTDOWN_PATTERNS: Record<Grade, CountdownPattern[]> = {
  E1: [
    pattern('E1-1', '低空', [
      { number: 4, color: 'green' },
      { number: 3, color: 'green' },
      { number: 2, color: 'green' },
      { number: 1, color: 'green' },
    ]),
    pattern('E1-2', '標準', [
      { number: 5, color: 'green' },
      { number: 4, color: 'green' },
      { number: 3, color: 'green' },
      { number: 2, color: 'green' },
    ]),
    pattern('E1-3', 'やや高め', [
      { number: 6, color: 'green' },
      { number: 5, color: 'green' },
      { number: 4, color: 'green' },
      { number: 3, color: 'green' },
    ]),
    pattern('E1-4', '高数字緑', [
      { number: 7, color: 'green' },
      { number: 6, color: 'green' },
      { number: 5, color: 'green' },
      { number: 4, color: 'green' },
    ]),
    pattern('E1-5', '最高数字緑', [
      { number: 8, color: 'green' },
      { number: 7, color: 'green' },
      { number: 6, color: 'green' },
      { number: 5, color: 'green' },
    ]),
    pattern('E1-6', '飛び番', [
      { number: 6, color: 'green' },
      { number: 4, color: 'green' },
      { number: 2, color: 'green' },
      { number: 1, color: 'green' },
    ]),
  ],
  E2: [
    pattern('E2-1', '最後だけ青', [
      { number: 5, color: 'green' },
      { number: 4, color: 'green' },
      { number: 3, color: 'green' },
      { number: 2, color: 'blue' },
    ]),
    pattern('E2-2', '後半青', [
      { number: 4, color: 'green' },
      { number: 3, color: 'green' },
      { number: 2, color: 'blue' },
      { number: 1, color: 'blue' },
    ]),
    pattern('E2-3', '遅咲き', [
      { number: 6, color: 'green' },
      { number: 5, color: 'green' },
      { number: 4, color: 'green' },
      { number: 3, color: 'blue' },
    ]),
    pattern('E2-4', '早めの青', [
      { number: 7, color: 'green' },
      { number: 6, color: 'blue' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'blue' },
    ]),
    pattern('E2-5', '高数字遅咲き', [
      { number: 8, color: 'green' },
      { number: 7, color: 'green' },
      { number: 6, color: 'green' },
      { number: 5, color: 'blue' },
    ]),
    pattern('E2-6', '1点青', [
      { number: 5, color: 'green' },
      { number: 4, color: 'green' },
      { number: 3, color: 'blue' },
      { number: 2, color: 'green' },
    ]),
  ],
  E3: [
    pattern('E3-1', '標準青', [
      { number: 6, color: 'blue' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'blue' },
      { number: 3, color: 'blue' },
    ]),
    pattern('E3-2', '低空青', [
      { number: 4, color: 'blue' },
      { number: 3, color: 'blue' },
      { number: 2, color: 'blue' },
      { number: 1, color: 'blue' },
    ]),
    pattern('E3-3', '高数字青', [
      { number: 8, color: 'blue' },
      { number: 7, color: 'blue' },
      { number: 6, color: 'blue' },
      { number: 5, color: 'blue' },
    ]),
    pattern('E3-4', 'やや高青', [
      { number: 7, color: 'blue' },
      { number: 6, color: 'blue' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'blue' },
    ]),
    pattern('E3-5', 'フェイク青', [
      { number: 6, color: 'blue' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'green' },
      { number: 3, color: 'blue' },
    ]),
    pattern('E3-6', '飛び番青', [
      { number: 8, color: 'blue' },
      { number: 6, color: 'blue' },
      { number: 4, color: 'blue' },
      { number: 2, color: 'blue' },
    ]),
  ],
  E4: [
    pattern('E4-1', '最後だけ赤', [
      { number: 7, color: 'blue' },
      { number: 6, color: 'blue' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'red' },
    ]),
    pattern('E4-2', '後半赤', [
      { number: 7, color: 'blue' },
      { number: 6, color: 'blue' },
      { number: 5, color: 'red' },
      { number: 4, color: 'red' },
    ]),
    pattern('E4-3', '全赤', [
      { number: 8, color: 'red' },
      { number: 7, color: 'red' },
      { number: 6, color: 'red' },
      { number: 5, color: 'red' },
    ]),
    pattern('E4-4', '低空全赤', [
      { number: 5, color: 'red' },
      { number: 4, color: 'red' },
      { number: 3, color: 'red' },
      { number: 2, color: 'red' },
    ]),
    pattern('E4-5', '2段昇格', [
      { number: 6, color: 'green' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'blue' },
      { number: 3, color: 'red' },
    ]),
    pattern('E4-6', '3段昇格', [
      { number: 5, color: 'green' },
      { number: 4, color: 'blue' },
      { number: 3, color: 'red' },
      { number: 2, color: 'red' },
    ]),
  ],
  E5: [
    pattern('E5-1', '赤からの虹', [
      { number: 8, color: 'red' },
      { number: 7, color: 'red' },
      { number: 6, color: 'red' },
      { number: 5, color: 'rainbow' },
    ]),
    pattern('E5-2', '青赤虹', [
      { number: 8, color: 'blue' },
      { number: 7, color: 'blue' },
      { number: 6, color: 'red' },
      { number: 5, color: 'rainbow' },
    ]),
    pattern('E5-3', '低数字赤虹', [
      { number: 5, color: 'red' },
      { number: 4, color: 'red' },
      { number: 3, color: 'red' },
      { number: 2, color: 'rainbow' },
    ]),
    pattern('E5-4', '全段昇格虹', [
      { number: 6, color: 'green' },
      { number: 5, color: 'blue' },
      { number: 4, color: 'red' },
      { number: 3, color: 'rainbow' },
    ]),
    pattern('E5-5', '緑からの奇跡虹', [
      { number: 4, color: 'green' },
      { number: 3, color: 'green' },
      { number: 2, color: 'red' },
      { number: 1, color: 'rainbow' },
    ]),
    pattern('E5-6', '全赤長虹', [
      { number: 7, color: 'red' },
      { number: 6, color: 'red' },
      { number: 5, color: 'red' },
      { number: 4, color: 'rainbow' },
    ]),
  ],
};
