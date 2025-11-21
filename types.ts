
export enum Rarity {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

export interface CardData {
  id: string;
  name: string;
  type: string; // Fire, Water, etc.
  hp: number;
  attack: number;
  description: string;
  imageUrl?: string; // Optional custom AI generated image
}

// Inventory key format: `${cardId}_${rarity}`
export type Inventory = Record<string, number>;

export interface AdventureProgress {
  currentZoneIndex: number;
  currentStage: number; // 1 to 5
  unlockedZones: number; // Max reached zone index
}

export interface GameState {
  inventory: Inventory;
  knownCards: Record<string, CardData>; // The "Pokedex" database
  tokens: number; // Currency for scouting
  adventure: AdventureProgress;
  hasClaimedStarter: boolean;
  // Mapping of cardId -> Awakening Level (0-5)
  awakening: Record<string, number>;
}

// --- Skill System Types ---

export type SkillEffectType = 'DAMAGE' | 'HEAL' | 'BUFF_ATK' | 'DEBUFF_DEF';

export interface Skill {
  name: string;
  description: string;
  power: number; // Damage multiplier or Heal percentage (e.g. 0.3 for 30%)
  cd: number; // Cooldown in turns
  type: SkillEffectType;
}

export interface Buff {
  type: SkillEffectType;
  duration: number; // Turns remaining
  value: number; // Magnitude (e.g. 1.5 for 50% boost)
}

export interface BattleCard extends CardData {
  rarity: Rarity;
  maxHp: number;
  currentHp: number;
  awakeningLevel: number;
  skills: Skill[];
}

export interface HitMeta {
  value: number;
  type: SkillEffectType;
  isCrit: boolean;
  isEffective: boolean; // > 1.0 multiplier
}

export enum BattleStatus {
    ACTIVE = 'ACTIVE',
    WON = 'WON',
    LOST = 'LOST',
    RUNNING = 'RUNNING', // Animation state
    WAITING_FOR_SWITCH = 'WAITING_FOR_SWITCH' // When active pokemon dies
}

export interface BattleState {
  playerTeam: BattleCard[]; // Array of up to 6 Pokemon
  activeCardIndex: number; // Index of currently fighting pokemon
  enemyCard: BattleCard;
  
  turn: number;
  logs: string[];
  isPlayerTurn: boolean;
  status: BattleStatus;
  
  isBoss: boolean;
  battleType: 'adventure' | 'training';
  reward: number;
  
  // Cooldown tracking: Array of arrays? Or store in BattleCard? 
  // Simpler to store in state for reactivity, but for team we need map.
  // Let's keep simple: Active pokemon's CD is tracked here. 
  // When switching, we might reset or pause CD. For simplicity, reset on switch.
  playerCooldowns: number[];
  enemyCooldowns: number[];
  
  // Active Buffs
  playerBuffs: Buff[];
  enemyBuffs: Buff[];

  // VFX Tracking
  lastPlayerAction?: SkillEffectType;
  lastEnemyAction?: SkillEffectType;

  // Hit Results for Floating Text
  playerResult?: HitMeta; // Result of Player's move
  enemyResult?: HitMeta; // Result of Enemy's move
}

export interface ZoneData {
  name: string;
  description: string;
  color: string;
  bossRarityMin: Rarity;
  allowedTypes: string[]; // e.g. ['Grass', 'Bug']
  bossId: string; // Fixed boss card ID
}
