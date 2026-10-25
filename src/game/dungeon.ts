/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ENEMY_TEMPLATES,
  EVENT_TEMPLATES,
  LOOT_ABILITIES,
  TRAP_TEMPLATES,
} from './data';
import { getNextCampDistance, rollDice } from './rules';
import {
  ConsumableItem,
  Enemy,
  PlayerCharacter,
  Room,
  RoomType,
} from './types';

/**
 * Determine enemy tier based on player level
 */
export function getTierForLevel(level: number): 1 | 2 | 3 {
  if (level <= 4) return 1;
  if (level <= 10) return 2;
  return 3;
}

/**
 * Generate an enemy scaled to player tier and level
 */
export function generateEnemy(tier: 1 | 2 | 3, isBoss: boolean, playerLevel: number): Enemy {
  const eligible = ENEMY_TEMPLATES.filter((e) => e.tier === tier && e.isBoss === isBoss);
  const template = eligible[Math.floor(Math.random() * eligible.length)] || ENEMY_TEMPLATES[0];

  // Base random HP in range
  const hpRange = template.maxHp - template.minHp;
  let hp = template.minHp + (hpRange > 0 ? Math.floor(Math.random() * (hpRange + 1)) : 0);
  let attackBonus = template.attackBonus;
  let damageBonus = template.damageDice.bonus;

  // Tier 3 scaling past level 11 (+10% HP, +1 damage per extra level)
  if (playerLevel > 11) {
    const extraLevels = playerLevel - 11;
    hp = Math.round(hp * (1 + 0.1 * extraLevels));
    damageBonus += extraLevels;
    attackBonus += Math.floor(extraLevels / 2);
  }

  // Gold reward
  let goldReward = 0;
  if (tier === 1) goldReward = 10 + Math.floor(Math.random() * 21); // 10-30
  else if (tier === 2) goldReward = 40 + Math.floor(Math.random() * 61); // 40-100
  else goldReward = 150 + Math.floor(Math.random() * 251); // 150-400

  if (isBoss) {
    goldReward = Math.round(goldReward * 1.5);
  }

  const xpReward = isBoss ? 150 : 40;

  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: template.name,
    tier,
    isBoss,
    maxHp: hp,
    currentHp: hp,
    ac: template.ac,
    attackBonus,
    damageDice: {
      count: template.damageDice.count,
      sides: template.damageDice.sides,
      bonus: damageBonus,
    },
    attacksPerTurn: template.attacksPerTurn || 1,
    statusEffects: [],
    description: template.description,
    goldReward,
    xpReward,
  };
}

/**
 * Generate loot for safe rooms or boss rewards
 */
export function generateLoot(tier: 1 | 2 | 3, isBoss: boolean): {
  gold: number;
  item?: ConsumableItem;
  equipmentUpgrade?: boolean;
} {
  let gold = 10 + Math.floor(Math.random() * 21);
  if (tier === 2) gold = 40 + Math.floor(Math.random() * 61);
  if (tier === 3) gold = 150 + Math.floor(Math.random() * 251);

  if (isBoss) {
    gold = Math.round(gold * 1.5);
  }

  // Equipment upgrade ~30%
  const hasUpgrade = Math.random() < 0.3;

  // Scroll or Tome ~15% (or guaranteed 50% for boss)
  const scrollChance = isBoss ? 0.5 : 0.15;
  let item: ConsumableItem | undefined = undefined;

  if (Math.random() < scrollChance) {
    // Pick an ability of the tier
    const eligibleAbilities = LOOT_ABILITIES.filter((a) => a.tier === tier);
    const chosenAbility = eligibleAbilities[Math.floor(Math.random() * eligibleAbilities.length)];
    if (chosenAbility) {
      const isArcane = chosenAbility.allowedClasses?.some((c) => c === 'Mago' || c === 'Clérigo');
      item = {
        id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        name: isArcane ? `Pergamino Arcano: ${chosenAbility.name}` : `Tomo Marcial: ${chosenAbility.name}`,
        type: isArcane ? 'scroll' : 'tome',
        description: `Enseña la habilidad [${chosenAbility.name}] (${chosenAbility.damageDice ? `${chosenAbility.damageDice.count}d8` : 'Especial'}). Si no es para tu clase, puedes venderlo en la tienda.`,
        teachesAbility: chosenAbility,
        allowedClasses: chosenAbility.allowedClasses,
        value: tier === 1 ? 50 : tier === 2 ? 100 : 250,
      };
    }
  } else if (Math.random() < 0.5) {
    // Health potion or energy potion
    const isEnergy = Math.random() < 0.35;
    item = isEnergy
      ? {
          id: `pot_e_${Date.now()}`,
          name: 'Elixir de Maná Concentrado',
          type: 'potion_energy',
          energyAmount: tier === 1 ? 1 : 2,
          description: `Recupera ${tier === 1 ? 1 : 2} punto(s) de Energía / Magia de inmediato.`,
          value: 30 * tier,
        }
      : {
          id: `pot_h_${Date.now()}`,
          name: tier === 1 ? 'Poción de Curación Menor' : tier === 2 ? 'Poción de Curación Mayor' : 'Poción Superior de Vida',
          type: 'potion_heal',
          healAmount: tier === 1 ? 15 : tier === 2 ? 30 : 60,
          description: `Restaura ${tier === 1 ? 15 : tier === 2 ? 30 : 60} puntos de golpe al instante.`,
          value: 25 * tier,
        };
  }

  return {
    gold,
    item,
    equipmentUpgrade: hasUpgrade,
  };
}

/**
 * Generate next room in dungeon expedition
 */
export function generateNextRoom(
  overallRoomIndex: number,
  campIndex: number,
  player: PlayerCharacter
): Room {
  const totalForCamp = getNextCampDistance(campIndex);
  // subIndex is 1-based, from 1 to totalForCamp
  const subIndex = ((overallRoomIndex - 1) % totalForCamp) + 1;
  const isBossRoom = subIndex === totalForCamp;
  const tier = getTierForLevel(player.level);

  let type: RoomType = 'combat';
  let enemy: Enemy | undefined = undefined;
  let trap = undefined;
  let event = undefined;
  let loot = undefined;

  if (isBossRoom) {
    type = 'combat';
    enemy = generateEnemy(tier, true, player.level);
    loot = generateLoot(tier, true);
  } else {
    // Non-boss rooms: random distribution
    const roll = Math.random();
    if (roll < 0.45) {
      type = 'combat';
      enemy = generateEnemy(tier, false, player.level);
    } else if (roll < 0.65) {
      type = 'trap';
      const trapIdx = Math.floor(Math.random() * TRAP_TEMPLATES.length);
      trap = TRAP_TEMPLATES[trapIdx];
    } else if (roll < 0.85) {
      type = 'event';
      const eventIdx = Math.floor(Math.random() * EVENT_TEMPLATES.length);
      event = EVENT_TEMPLATES[eventIdx];
    } else {
      type = 'safe';
      loot = generateLoot(tier, false);
    }
  }

  const roomTitles: Record<RoomType, string[]> = {
    combat: [
      'Cámara de la Guardia Subterránea',
      'Pasaje Lleno de Huesos Quebrados',
      'Cripta de los Condenados',
      'Sala de Torturas Abandonada',
      'Galería de Estalagmitas Sombrías',
    ],
    trap: [
      'Corredor de Baldosas Agrietadas',
      'Cámara de Mecanismos Antiguos',
      'Pasillo Estrecho de Techo Bajo',
      'Fosa de los Sacrificios Olvidados',
    ],
    event: [
      'Santuario Profanado en la Roca',
      'Encrucijada Iluminada por Hongos Fosforescentes',
      'Ruinas de un Antiguo Campamento',
      'Cámara del Pozo Sin Fondo',
    ],
    safe: [
      'Cámara del Tesoro Secreta',
      'Bóveda Oculta tras un Muro Falso',
      'Cueva Tranquila con Brisa Fresca',
      'Refugio de Piedra con Cofre de Hierro',
    ],
  };

  const titles = roomTitles[type];
  const title = isBossRoom
    ? `Cámara del Guardián Mayor (Jefe): ${enemy?.name}`
    : titles[Math.floor(Math.random() * titles.length)];

  let description = '';
  if (type === 'combat') {
    description = isBossRoom
      ? `Un terrible rugido sacude las paredes de la estancia. ¡${enemy?.name} emerge de las sombras para bloquear tu paso al campamento!`
      : `Al cruzar el arco de piedra, una silueta hostil salta al ataque: ¡un ${enemy?.name}!`;
  } else if (type === 'trap') {
    description = trap?.description || 'Detectas un mecanismo letal ante ti.';
  } else if (type === 'event') {
    description = event?.description || 'Una escena intrigante se abre ante tus ojos.';
  } else {
    description =
      'La sala está en calma. Entre los escombros descansa un cofre de hierro reforzado con botín intacto.';
  }

  return {
    index: overallRoomIndex,
    subIndex,
    totalForCamp,
    type,
    title,
    description,
    isBossRoom,
    enemy,
    trap,
    event,
    loot,
    cleared: false,
  };
}
