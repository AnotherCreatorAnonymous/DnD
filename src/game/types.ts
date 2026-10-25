/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClassType = 'Guerrero' | 'Clérigo' | 'Pícaro' | 'Mago' | 'Explorador';

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface Attributes {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export type ArmorType = 'none' | 'light' | 'medium' | 'heavy';

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'accessory';
  armorType?: ArmorType;
  baseDamageDice?: { count: number; sides: number }; // e.g. { count: 1, sides: 8 }
  isRangedOrLight?: boolean;
  bonusAC?: number;
  upgradeLevel: number; // +0, +1, +2, +3
  description: string;
  sellValue: number;
}

export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  weapon: EquipmentItem;
  armor: EquipmentItem;
  shield?: EquipmentItem;
}

export type AbilityCategory = 'basic' | 'cantrip' | 'special' | 'spell' | 'loot_t1' | 'loot_t2' | 'loot_t3';

export interface Ability {
  id: string;
  name: string;
  category: AbilityCategory;
  cost: number; // 0 for basic/cantrips, 1 for special/spells
  attribute: AttributeKey;
  target: 'enemy' | 'self';
  damageDice?: { count: number; sides: number };
  description: string;
  effectType?: 'damage' | 'heal' | 'shield_of_faith' | 'second_wind' | 'sleep' | 'poison' | 'hunter_mark' | 'stun' | 'uncanny_dodge';
  allowedClasses?: ClassType[];
  tier?: 1 | 2 | 3;
}

export interface StatusEffect {
  type: 'poisoned' | 'stunned' | 'asleep' | 'hunter_mark' | 'shield_of_faith' | 'uncanny_dodge';
  name: string;
  duration: number; // turns remaining
  value?: number;
}

export interface PlayerCharacter {
  name: string;
  classType: ClassType;
  level: number;
  xp: number;
  maxHp: number;
  currentHp: number;
  maxEnergy: number;
  currentEnergy: number;
  attributes: Attributes;
  equippedWeapon: EquipmentItem;
  equippedArmor: EquipmentItem;
  equippedShield?: EquipmentItem;
  abilities: Ability[]; // Max 6
  inventory: ConsumableItem[];
  statusEffects: StatusEffect[];
  safeGold: number;
  expeditionGold: number;
}

export interface ConsumableItem {
  id: string;
  name: string;
  type: 'potion_heal' | 'potion_energy' | 'scroll' | 'tome' | 'antidote';
  description: string;
  healAmount?: number;
  energyAmount?: number;
  teachesAbility?: Ability;
  allowedClasses?: ClassType[];
  value: number;
}

export interface Enemy {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  isBoss: boolean;
  maxHp: number;
  currentHp: number;
  ac: number;
  attackBonus: number;
  damageDice: { count: number; sides: number; bonus: number };
  attacksPerTurn?: number;
  statusEffects: StatusEffect[];
  description: string;
  goldReward: number;
  xpReward: number;
}

export type RoomType = 'combat' | 'trap' | 'event' | 'safe';

export interface TrapData {
  name: string;
  description: string;
  attributeCheck: 'DEX' | 'CON';
  dc: number;
  failureDamageDice: { count: number; sides: number };
  avoidSuccessMsg: string;
  failureMsg: string;
}

export interface EventOption {
  text: string;
  check?: {
    attribute: AttributeKey;
    dc: number;
  };
  successResult: {
    msg: string;
    gold?: number;
    hpDelta?: number;
    item?: ConsumableItem;
    xp?: number;
  };
  failureResult?: {
    msg: string;
    hpDelta?: number;
    goldLoss?: number;
  };
}

export interface EventData {
  title: string;
  description: string;
  options: EventOption[];
}

export interface Room {
  index: number; // Overall room count in current run
  subIndex: number; // 1 to totalForCamp
  totalForCamp: number; // Rooms needed for next camp
  type: RoomType;
  title: string;
  description: string;
  isBossRoom: boolean;
  enemy?: Enemy;
  trap?: TrapData;
  event?: EventData;
  loot?: {
    gold: number;
    item?: ConsumableItem;
    equipmentUpgrade?: boolean;
  };
  cleared: boolean;
}

export interface CombatLogEntry {
  id: string;
  text: string;
  type: 'info' | 'player_atk' | 'enemy_atk' | 'crit' | 'fumble' | 'heal' | 'status' | 'partial';
  rollDetails?: string;
}

export type GameScreen = 'title' | 'character_creation' | 'room' | 'combat' | 'camp' | 'gameover';
