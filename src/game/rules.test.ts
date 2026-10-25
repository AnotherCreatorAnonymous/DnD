/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getModifier,
  getProficiency,
  calculateAC,
  calculateMaxHP,
  calculateMaxEnergy,
  getNextCampDistance,
  getXpForNextLevel,
  getEnemyHpStatus,
  evaluateAttackRoll,
  formatAttackRollLog,
  rollDice,
  rollD20
} from './rules.ts';

test('Attribute modifiers follow standard D&D rules: floor((score - 10) / 2)', () => {
  assert.equal(getModifier(15), 2);
  assert.equal(getModifier(14), 2);
  assert.equal(getModifier(13), 1);
  assert.equal(getModifier(12), 1);
  assert.equal(getModifier(10), 0);
  assert.equal(getModifier(8), -1);
  assert.equal(getModifier(18), 4);
  assert.equal(getModifier(20), 5);
});

test('Proficiency scales correctly with level', () => {
  assert.equal(getProficiency(1), 2);
  assert.equal(getProficiency(4), 2);
  assert.equal(getProficiency(5), 3);
  assert.equal(getProficiency(8), 3);
  assert.equal(getProficiency(9), 4);
  assert.equal(getProficiency(12), 4);
  assert.equal(getProficiency(13), 5);
  assert.equal(getProficiency(20), 5);
});

test('Armor Class calculations match specifications', () => {
  // Sin armadura: 10 + DEX
  assert.equal(calculateAC('none', 3, false), 13);
  // Ligera: 12 + DEX
  assert.equal(calculateAC('light', 3, false), 15);
  // Media: 14 + DEX (máx +2)
  assert.equal(calculateAC('medium', 3, false), 16);
  assert.equal(calculateAC('medium', 1, false), 15);
  // Pesada: 17
  assert.equal(calculateAC('heavy', 3, false), 17);
  // Escudo adds +2
  assert.equal(calculateAC('heavy', 0, true), 19);
  assert.equal(calculateAC('medium', 2, true), 18);
  // Magical bonus +1/+2/+3
  assert.equal(calculateAC('heavy', 0, true, 1), 20);
});

test('Max HP calculations match exact class specifications', () => {
  // Guerrero: base 10 + CON, then +6 + CON per level
  assert.equal(calculateMaxHP('Guerrero', 2, 1), 12);
  assert.equal(calculateMaxHP('Guerrero', 2, 2), 20);
  assert.equal(calculateMaxHP('Guerrero', 2, 3), 28);

  // Mago: base 6 + CON, then +4 + CON per level
  assert.equal(calculateMaxHP('Mago', 1, 1), 7);
  assert.equal(calculateMaxHP('Mago', 1, 2), 12);

  // Clérigo: base 8 + CON, then +5 + CON per level
  assert.equal(calculateMaxHP('Clérigo', 3, 1), 11);
  assert.equal(calculateMaxHP('Clérigo', 3, 2), 19);
});

test('Max Energy starts at 2 and increases +1 every 2 levels', () => {
  assert.equal(calculateMaxEnergy(1), 2);
  assert.equal(calculateMaxEnergy(2), 2);
  assert.equal(calculateMaxEnergy(3), 3);
  assert.equal(calculateMaxEnergy(4), 3);
  assert.equal(calculateMaxEnergy(5), 4);
  assert.equal(calculateMaxEnergy(6), 4);
  assert.equal(calculateMaxEnergy(7), 5);
});

test('Camp milestones follow the exact sequence (3, 5, 8, 12, 17, 23, 30, 38)', () => {
  assert.equal(getNextCampDistance(0), 3);
  assert.equal(getNextCampDistance(1), 5);
  assert.equal(getNextCampDistance(2), 8);
  assert.equal(getNextCampDistance(3), 12);
  assert.equal(getNextCampDistance(4), 17);
  assert.equal(getNextCampDistance(5), 23);
  assert.equal(getNextCampDistance(6), 30);
  assert.equal(getNextCampDistance(7), 38);
});

test('XP thresholds match prompt table', () => {
  assert.equal(getXpForNextLevel(1), 100);
  assert.equal(getXpForNextLevel(2), 250);
  assert.equal(getXpForNextLevel(3), 450);
  assert.equal(getXpForNextLevel(10), 4000);
  assert.equal(getXpForNextLevel(11), 5000);
});

test('Attack roll resolution handles crits, fumbles, hits, partial hits, and misses', () => {
  // Target AC 14
  assert.equal(evaluateAttackRoll(20, 25, 14), 'crit');
  assert.equal(evaluateAttackRoll(1, 7, 14), 'fumble');
  assert.equal(evaluateAttackRoll(12, 17, 14), 'hit');
  assert.equal(evaluateAttackRoll(10, 14, 14), 'hit');
  // Parcial: entre (CA - 3) [11] y (CA - 1) [13]
  assert.equal(evaluateAttackRoll(8, 13, 14), 'partial');
  assert.equal(evaluateAttackRoll(7, 12, 14), 'partial');
  assert.equal(evaluateAttackRoll(6, 11, 14), 'partial');
  // Menos: Fallo
  assert.equal(evaluateAttackRoll(5, 10, 14), 'miss');
});

test('Combat log format exactly matches user requirement', () => {
  const log = formatAttackRollLog({
    d20: 14,
    mod: 3,
    prof: 2,
    total: 19,
    targetAC: 13,
    resolution: 'hit'
  });
  assert.equal(log, '[d20: 14 + 3 + 2 = 19 vs CA 13 → Éxito]');
});

test('Enemy HP status hides exact numbers and maps correctly', () => {
  assert.equal(getEnemyHpStatus(100, 100).status, 'Ileso');
  assert.equal(getEnemyHpStatus(80, 100).status, 'Herido');
  assert.equal(getEnemyHpStatus(35, 100).status, 'Tambaleándose');
  assert.equal(getEnemyHpStatus(10, 100).status, 'Al borde de la muerte');
});

test('Dice rolling functions produce values in valid ranges', () => {
  const d6 = rollDice(2, 6);
  assert.equal(d6.rolls.length, 2);
  assert.ok(d6.total >= 2 && d6.total <= 12);

  const d20Normal = rollD20('normal');
  assert.ok(d20Normal.d20 >= 1 && d20Normal.d20 <= 20);

  const d20Adv = rollD20('advantage');
  assert.ok(d20Adv.d20 >= 1 && d20Adv.d20 <= 20);
  assert.ok(d20Adv.roll2 !== undefined);
});
