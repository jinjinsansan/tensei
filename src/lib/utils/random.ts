export function randomFloat() {
  return Math.random();
}

export function randomInt(maxExclusive: number) {
  return Math.floor(randomFloat() * maxExclusive);
}

export function pickRandom<T>(items: T[]): T {
  if (!items.length) {
    throw new Error('Cannot pick from an empty array');
  }
  return items[randomInt(items.length)];
}

export function pickByWeight<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + (item.weight ?? 0), 0);
  if (total <= 0) {
    return items[randomInt(items.length)];
  }
  const roll = randomFloat() * total;
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.weight ?? 0;
    if (roll <= cumulative) {
      return item;
    }
  }
  return items[items.length - 1];
}
