/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArmorType, ClassType } from './types';

/**
 * Roll a standard dice combination (e.g. 2d8, 1d6)
 */
export function rollDice(count: number, sides: number): { rolls: number[]; total: number } {
  const rolls: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const val = Math.floor(Math.random() * sides) + 1;
    rolls.push(val);
    total += val;
  }
  return { rolls, total };
}

export type RollAdvantage = 'normal' | 'advantage' | 'disadvantage';

export interface D20Result {
  d20: number;
  roll1: number;
  roll2?: number;
  advantage: RollAdvantage;
  isCrit: boolean;
  isFumble: boolean;
}

/**
 * Roll a 1d20 with optional advantage or disadvantage
 */
export function rollD20(advantage: RollAdvantage = 'normal'): D20Result {
  const r1 = Math.floor(Math.random() * 20) + 1;
  if (advantage === 'normal') {
    return {
      d20: r1,
      roll1: r1,
      advantage,
      isCrit: r1 === 20,
      isFumble: r1 === 1,
    };
  }

  const r2 = Math.floor(Math.random() * 20) + 1;
  const chosen = advantage === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);

  return {
    d20: chosen,
    roll1: r1,
    roll2: r2,
    advantage,
    isCrit: chosen === 20,
    isFumble: chosen === 1,
  };
}

/**
 * Standard D&D attribute modifier: floor((score - 10) / 2)
 */
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Proficiency bonus based on character level:
 * Niv 1-4: +2, Niv 5-8: +3, Niv 9-12: +4, Niv 13+: +5
 */
export function getProficiency(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  return 5;
}

/**
 * Calculate Armor Class (CA):
 * - Sin armadura: 10 + DEX
 * - Ligera: 12 + DEX
 * - Media: 14 + DEX (máx +2)
 * - Pesada: 17
 * - Escudo: +2
 */
export function calculateAC(
  armorType: ArmorType,
  dexMod: number,
  hasShield: boolean = false,
  bonusAC: number = 0
): number {
  let baseAC = 10;
  switch (armorType) {
    case 'none':
      baseAC = 10 + dexMod;
      break;
    case 'light':
      baseAC = 12 + dexMod;
      break;
    case 'medium':
      baseAC = 14 + Math.min(dexMod, 2);
      break;
    case 'heavy':
      baseAC = 17;
      break;
  }
  if (hasShield) {
    baseAC += 2;
  }
  return baseAC + bonusAC;
}

/**
 * Hit die by class at Level 1:
 * Guerrero: 10, Explorador: 10, Clérigo: 8, Pícaro: 8, Mago: 6
 * Per level increase:
 * Guerrero/Explorador: +6 + CON_mod
 * Clérigo/Pícaro: +5 + CON_mod
 * Mago: +4 + CON_mod
 */
export function calculateMaxHP(classType: ClassType, conMod: number, level: number): number {
  let baseHitDie = 8;
  let perLevelGrowth = 5;

  if (classType === 'Guerrero' || classType === 'Explorador') {
    baseHitDie = 10;
    perLevelGrowth = 6;
  } else if (classType === 'Mago') {
    baseHitDie = 6;
    perLevelGrowth = 4;
  }

  const level1Hp = baseHitDie + conMod;
  const extraLevels = Math.max(0, level - 1);
  const additionalHp = extraLevels * (perLevelGrowth + conMod);

  // Guarantee at least 1 HP gain per level even with negative CON
  return Math.max(level, level1Hp + additionalHp);
}

/**
 * Max Energy/Magic:
 * 2 at level 1, +1 every 2 levels (e.g. Lvl 1-2: 2, Lvl 3-4: 3, Lvl 5-6: 4, etc.)
 */
export function calculateMaxEnergy(level: number): number {
  return 2 + Math.floor((level - 1) / 2);
}

/**
 * Camp sequence progression:
 * 3, 5, 8, 12, 17, 23, 30, 38...
 * Formula: next = prev + (index + 1)
 */
export function getNextCampDistance(campIndex: number): number {
  const sequence = [3, 5, 8, 12, 17, 23, 30, 38, 47, 57, 68, 80];
  if (campIndex < sequence.length) {
    return sequence[campIndex];
  }
  // Formula extension: sequence[k] where diffs are 2, 3, 4, 5, 6, 7, 8...
  let val = 3;
  let increment = 2;
  for (let i = 0; i < campIndex; i++) {
    val += increment;
    increment += 1;
  }
  return val;
}

/**
 * XP threshold for next level:
 * N2 100, N3 250, N4 450, N5 700, N6 1000, N7 1400, N8 1900, N9 2500, N10 3200, N11 4000, then +1000 per level
 */
export function getXpForNextLevel(currentLevel: number): number {
  const thresholds: Record<number, number> = {
    1: 100,
    2: 250,
    3: 450,
    4: 700,
    5: 1000,
    6: 1400,
    7: 1900,
    8: 2500,
    9: 3200,
    10: 4000,
  };
  if (currentLevel in thresholds) {
    return thresholds[currentLevel];
  }
  return 4000 + (currentLevel - 10) * 1000;
}

/**
 * Combat enemy HP status (without showing exact numbers):
 * - Ileso (100%)
 * - Herido (50% - 99%)
 * - Tambaleándose (20% - 49%)
 * - Al borde de la muerte (< 20%)
 */
export function getEnemyHpStatus(currentHp: number, maxHp: number): {
  status: string;
  color: string;
  percentage: number;
} {
  const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  if (pct >= 100) {
    return { status: 'Ileso', color: 'text-emerald-400', percentage: pct };
  }
  if (pct >= 50) {
    return { status: 'Herido', color: 'text-amber-400', percentage: pct };
  }
  if (pct >= 20) {
    return { status: 'Tambaleándose', color: 'text-orange-500', percentage: pct };
  }
  return { status: 'Al borde de la muerte', color: 'text-rose-500 font-bold', percentage: pct };
}

export type AttackResolution = 'crit' | 'hit' | 'partial' | 'miss' | 'fumble';

/**
 * Attack resolution vs Armor Class:
 * - 20 natural = crítico (dados de daño x2)
 * - 1 natural = fallo automático
 * - Total >= objetivo: Éxito
 * - Entre (objetivo - 3) y (objetivo - 1): Parcial (mitad de daño)
 * - Menos: Fallo
 */
export function evaluateAttackRoll(
  d20Roll: number,
  totalScore: number,
  targetAC: number
): AttackResolution {
  if (d20Roll === 20) return 'crit';
  if (d20Roll === 1) return 'fumble';
  if (totalScore >= targetAC) return 'hit';
  if (totalScore >= targetAC - 3) return 'partial';
  return 'miss';
}

/**
 * Format the combat d20 roll log entry:
 * [d20: 14 + 3 + 2 = 19 vs CA 13 → Éxito]
 */
export function formatAttackRollLog(params: {
  d20: number;
  mod: number;
  prof: number;
  extraBonus?: number;
  total: number;
  targetAC: number;
  resolution: AttackResolution;
  advantage?: RollAdvantage;
  attackerName?: string;
  isEnemy?: boolean;
}): string {
  const { d20, mod, prof, extraBonus = 0, total, targetAC, resolution, advantage } = params;

  let rollStr = `${d20}`;
  if (advantage === 'advantage') rollStr += ' (Ventaja)';
  if (advantage === 'disadvantage') rollStr += ' (Desventaja)';

  let calculation = `d20: ${rollStr} + ${mod} + ${prof}`;
  if (extraBonus !== 0) {
    calculation += ` + ${extraBonus}`;
  }
  calculation += ` = ${total} vs CA ${targetAC}`;

  let outcomeText = '';
  switch (resolution) {
    case 'crit':
      outcomeText = '¡Impacto Crítico! (Dados x2)';
      break;
    case 'hit':
      outcomeText = 'Éxito';
      break;
    case 'partial':
      outcomeText = 'Éxito Parcial (Mitad de daño)';
      break;
    case 'miss':
      outcomeText = 'Fallo';
      break;
    case 'fumble':
      outcomeText = 'Pifia (Fallo automático)';
      break;
  }

  return `[${calculation} → ${outcomeText}]`;
}
