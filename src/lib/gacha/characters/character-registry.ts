import type { CharacterId, CharacterModule } from '@/lib/gacha/common/types';

const registry = new Map<CharacterId, CharacterModule>();

export function registerCharacter(module: CharacterModule) {
  registry.set(module.characterId, module);
}

export function getCharacter(characterId: CharacterId): CharacterModule | undefined {
  return registry.get(characterId);
}

// 文字列からCharacterIdへの安全な変換（型ガード）
export function isValidCharacterId(value: string): value is CharacterId {
  return value === 'kenta' || value === 'shoichi' || value === 'tatumi' || value === 'yahei' || value === 'reiko';
}

export function listCharacters(): CharacterModule[] {
  return Array.from(registry.values());
}
