import type { CharacterModule } from '@/lib/gacha/common/types';

const registry = new Map<string, CharacterModule>();

export function registerCharacter(module: CharacterModule) {
  registry.set(module.characterId, module);
}

export function getCharacter(characterId: string): CharacterModule | undefined {
  return registry.get(characterId);
}

export function listCharacters(): CharacterModule[] {
  return Array.from(registry.values());
}
