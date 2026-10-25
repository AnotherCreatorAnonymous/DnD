/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  evaluateAttackRoll,
  formatAttackRollLog,
  getEnemyHpStatus,
  getModifier,
  getProficiency,
  rollD20,
  rollDice,
  RollAdvantage,
} from '../game/rules';
import {
  Ability,
  CombatLogEntry,
  ConsumableItem,
  Enemy,
  PlayerCharacter,
  StatusEffect,
} from '../game/types';
import { sounds } from '../utils/audio';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Backpack,
  Check,
  CornerDownRight,
  Droplets,
  Flame,
  Footprints,
  Heart,
  Moon,
  PlusCircle,
  Shield,
  Sparkles,
  Swords,
  Wand2,
  Zap,
} from 'lucide-react';

interface CombatViewProps {
  player: PlayerCharacter;
  enemy: Enemy;
  onVictory: (updatedPlayer: PlayerCharacter, xpGained: number, goldGained: number, itemDropped?: ConsumableItem) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

export const CombatView: React.FC<CombatViewProps> = ({
  player,
  enemy: initialEnemy,
  onVictory,
  onDefeat,
  onFlee,
}) => {
  const [enemy, setEnemy] = useState<Enemy>({ ...initialEnemy, statusEffects: [] });
  const [playerHp, setPlayerHp] = useState<number>(player.currentHp);
  const [playerEnergy, setPlayerEnergy] = useState<number>(player.currentEnergy);
  const [playerStatus, setPlayerStatus] = useState<StatusEffect[]>([...player.statusEffects]);
  const [enemyStatus, setEnemyStatus] = useState<StatusEffect[]>([]);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([
    {
      id: `log_init_${Date.now()}`,
      text: `¡Comienza el enfrentamiento contra ${initialEnemy.name}!`,
      type: 'info',
    },
  ]);

  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [isCombatOver, setIsCombatOver] = useState<boolean>(false);
  const [showItemPicker, setShowItemPicker] = useState<boolean>(false);
  const [floatingDamage, setFloatingDamage] = useState<{ target: 'player' | 'enemy'; text: string; isCrit?: boolean; isHeal?: boolean } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  // Floating feedback timer
  const triggerFloatingText = (target: 'player' | 'enemy', text: string, isCrit?: boolean, isHeal?: boolean) => {
    setFloatingDamage({ target, text, isCrit, isHeal });
    setTimeout(() => setFloatingDamage(null), 1200);
  };

  const addLog = (entry: Omit<CombatLogEntry, 'id'>) => {
    setCombatLogs((prev) => [...prev, { ...entry, id: `log_${Date.now()}_${Math.random()}` }]);
  };

  // Check if player has status
  const hasPlayerStatus = (type: StatusEffect['type']) => playerStatus.some((s) => s.type === type);
  const hasEnemyStatus = (type: StatusEffect['type']) => enemyStatus.some((s) => s.type === type);

  // Compute live Player AC (e.g. +2 if Shield of Faith is active)
  const baseAC = player.equippedArmor.armorType === 'heavy'
    ? 17
    : player.equippedArmor.armorType === 'medium'
    ? 14 + Math.min(2, getModifier(player.attributes.DEX))
    : player.equippedArmor.armorType === 'light'
    ? 12 + getModifier(player.attributes.DEX)
    : 10 + getModifier(player.attributes.DEX);

  const shieldBonus = player.equippedShield ? 2 : 0;
  const faithBonus = hasPlayerStatus('shield_of_faith') ? 2 : 0;
  const effectivePlayerAC = baseAC + shieldBonus + (player.equippedArmor.upgradeLevel || 0) + faithBonus;

  // Process end of turn status effect ticks (Poison, Stun, Sleep countdowns)
  const processStatusTicks = (forTarget: 'player' | 'enemy'): { canAct: boolean } => {
    let canAct = true;

    if (forTarget === 'player') {
      const nextStatuses: StatusEffect[] = [];
      for (const s of playerStatus) {
        if (s.type === 'poisoned') {
          const poisonDmg = rollDice(1, 4).total;
          sounds.playHit();
          setPlayerHp((prev) => {
            const next = Math.max(0, prev - poisonDmg);
            if (next <= 0) setTimeout(onDefeat, 800);
            return next;
          });
          addLog({
            text: `El veneno corroe tus venas infligiendo ${poisonDmg} de daño tóxico.`,
            type: 'status',
          });
        }
        if (s.type === 'stunned') {
          canAct = false;
          addLog({ text: 'Estás aturdido y no puedes reaccionar este turno.', type: 'status' });
        }
        if (s.type === 'asleep') {
          canAct = false;
          addLog({ text: 'Estás sumido en un profundo sueño mágico.', type: 'status' });
        }

        const remaining = s.duration - 1;
        if (remaining > 0) {
          nextStatuses.push({ ...s, duration: remaining });
        } else {
          addLog({ text: `El efecto de ${s.name} se ha disipado.`, type: 'info' });
        }
      }
      setPlayerStatus(nextStatuses);
    } else {
      const nextEnemyStatuses: StatusEffect[] = [];
      for (const s of enemyStatus) {
        if (s.type === 'poisoned') {
          const poisonDmg = rollDice(1, 4).total;
          setEnemy((prev) => {
            const nextHp = Math.max(0, prev.currentHp - poisonDmg);
            return { ...prev, currentHp: nextHp };
          });
          addLog({
            text: `El veneno quema a ${enemy.name} por ${poisonDmg} de daño.`,
            type: 'status',
          });
        }
        if (s.type === 'stunned') {
          canAct = false;
          addLog({ text: `${enemy.name} está aturdido y no puede actuar.`, type: 'status' });
        }
        if (s.type === 'asleep') {
          canAct = false;
          addLog({ text: `${enemy.name} está profundamente dormido.`, type: 'status' });
        }

        const remaining = s.duration - 1;
        if (remaining > 0) {
          nextEnemyStatuses.push({ ...s, duration: remaining });
        } else {
          addLog({ text: `${enemy.name} se recupera de ${s.name}.`, type: 'info' });
        }
      }
      setEnemyStatus(nextEnemyStatuses);
    }

    return { canAct };
  };

  // Enemy AI Turn Execution
  const executeEnemyTurn = (currentEnemyHp: number) => {
    if (currentEnemyHp <= 0) return;

    setTimeout(() => {
      const { canAct } = processStatusTicks('enemy');
      if (!canAct) {
        setIsPlayerTurn(true);
        return;
      }

      // Enemy attacks
      const attacks = enemy.attacksPerTurn || 1;
      let totalDamageTaken = 0;

      for (let i = 0; i < attacks; i++) {
        // Disadvantage if poisoned
        const adv: RollAdvantage = hasEnemyStatus('poisoned') ? 'disadvantage' : 'normal';
        const d20 = rollD20(adv);
        const mod = enemy.attackBonus;
        const total = d20.d20 + mod;
        const resolution = evaluateAttackRoll(d20.d20, total, effectivePlayerAC);

        sounds.playDiceRoll();

        const logStr = formatAttackRollLog({
          d20: d20.d20,
          mod,
          prof: 0,
          total,
          targetAC: effectivePlayerAC,
          resolution,
          advantage: adv,
          attackerName: enemy.name,
          isEnemy: true,
        });

        if (resolution === 'crit' || resolution === 'hit' || resolution === 'partial') {
          const diceCount = resolution === 'crit' ? enemy.damageDice.count * 2 : enemy.damageDice.count;
          let rawDmg = rollDice(diceCount, enemy.damageDice.sides).total + enemy.damageDice.bonus;
          if (resolution === 'partial') {
            rawDmg = Math.max(1, Math.floor(rawDmg / 2));
          }

          // Uncanny dodge for rogue
          if (hasPlayerStatus('uncanny_dodge')) {
            rawDmg = Math.max(1, Math.floor(rawDmg / 2));
            addLog({ text: '¡Evasión Asombrosa reduce el impacto a la mitad!', type: 'info' });
          }

          totalDamageTaken += rawDmg;
          sounds.playHit(resolution === 'crit');
          triggerFloatingText('player', `-${rawDmg}`, resolution === 'crit');

          addLog({
            text: `${enemy.name} te ataca: ${logStr} causándote ${rawDmg} de daño.`,
            type: resolution === 'crit' ? 'crit' : 'enemy_atk',
            rollDetails: logStr,
          });
        } else {
          addLog({
            text: `${enemy.name} te ataca: ${logStr}`,
            type: 'info',
            rollDetails: logStr,
          });
        }
      }

      // Apply damage to player
      if (totalDamageTaken > 0) {
        setPlayerHp((prev) => {
          const next = Math.max(0, prev - totalDamageTaken);
          if (next <= 0) {
            sounds.playDefeat();
            setIsCombatOver(true);
            setTimeout(onDefeat, 1200);
          }
          return next;
        });
      }

      // Clear one-turn defense buffs like uncanny dodge
      setPlayerStatus((prev) => prev.filter((s) => s.type !== 'uncanny_dodge'));

      setIsPlayerTurn(true);
    }, 600);
  };

  // Player executes an ability
  const handlePlayerAction = (ability: Ability) => {
    if (!isPlayerTurn || isCombatOver) return;
    if (ability.cost > 0 && playerEnergy < ability.cost) {
      addLog({ text: '¡No tienes suficiente Energía o Magia para esta habilidad!', type: 'info' });
      return;
    }

    // Deduct cost
    if (ability.cost > 0) {
      setPlayerEnergy((prev) => prev - ability.cost);
    }

    setIsPlayerTurn(false);

    // Check advantage/disadvantage:
    // Advantage if enemy is asleep, stunned, or player has hunter_mark / stealth
    let adv: RollAdvantage = 'normal';
    if (hasEnemyStatus('asleep') || hasEnemyStatus('stunned')) {
      adv = 'advantage';
    } else if (hasPlayerStatus('poisoned')) {
      adv = 'disadvantage';
    }

    const attr = ability.attribute || 'STR';
    const attrScore = player.attributes[attr];
    const mod = getModifier(attrScore);
    const prof = getProficiency(player.level);
    const weaponUpgrade = player.equippedWeapon.upgradeLevel || 0;

    // Self-targeted healing / buffing spells
    if (ability.target === 'self') {
      if (ability.effectType === 'heal') {
        sounds.playHeal();
        const healRoll = rollDice(2, 8).total + getModifier(player.attributes.WIS);
        const actualHealed = Math.min(player.maxHp - playerHp, healRoll);
        setPlayerHp((prev) => Math.min(player.maxHp, prev + healRoll));
        triggerFloatingText('player', `+${actualHealed}`, false, true);
        addLog({
          text: `Invocas Curar Heridas: [2d8 + WIS] restauras ${actualHealed} puntos de golpe.`,
          type: 'heal',
        });
      } else if (ability.effectType === 'shield_of_faith') {
        sounds.playSpellCast();
        setPlayerStatus((prev) => [...prev, { type: 'shield_of_faith', name: 'Escudo de Fe (+2 CA)', duration: 99 }]);
        addLog({
          text: 'Un aura divina te rodea: Escudo de Fe otorga +2 a tu CA durante este combate.',
          type: 'status',
        });
      } else if (ability.effectType === 'second_wind') {
        sounds.playHeal();
        const healVal = rollDice(1, 10).total + player.level;
        setPlayerHp((prev) => Math.min(player.maxHp, prev + healVal));
        triggerFloatingText('player', `+${healVal}`, false, true);
        addLog({
          text: `Segundo Aliento: recuperas ${healVal} de HP con pura resistencia física.`,
          type: 'heal',
        });
      } else if (ability.effectType === 'uncanny_dodge') {
        sounds.playSpellCast();
        setPlayerStatus((prev) => [...prev, { type: 'uncanny_dodge', name: 'Evasión Asombrosa', duration: 1 }]);
        addLog({
          text: 'Te preparas con reflejos felinos: el próximo golpe que recibas causará la mitad de daño.',
          type: 'status',
        });
      } else if (ability.effectType === 'hunter_mark') {
        sounds.playSpellCast();
        setPlayerStatus((prev) => [...prev, { type: 'hunter_mark', name: 'Marca del Cazador (+1d6)', duration: 99 }]);
        addLog({
          text: 'Marcas a tu presa: todos tus ataques en esta sala causarán +1d6 de daño adicional.',
          type: 'status',
        });
      }

      // Enemy turn
      executeEnemyTurn(enemy.currentHp);
      return;
    }

    // Special status spells like Dormir
    if (ability.effectType === 'sleep') {
      sounds.playSpellCast();
      if (enemy.currentHp >= 30) {
        addLog({
          text: `Dormir falla: ${enemy.name} tiene demasiada vitalidad (se requiere que tenga menos de 30 HP).`,
          type: 'info',
        });
      } else {
        // DC 13 CON check for enemy
        const enemySave = rollD20('normal').d20 + 1; // minor enemy con
        if (enemySave < 13) {
          sounds.playSpellCast();
          setEnemyStatus((prev) => [...prev, { type: 'asleep', name: 'Dormido', duration: 2 }]);
          addLog({
            text: `¡${enemy.name} cae en un sopor profundo! Está dormido por 2 turnos (los ataques contra él tienen ventaja). [Salvación CON: ${enemySave} vs CD 13 → Fallo]`,
            type: 'status',
          });
        } else {
          addLog({
            text: `${enemy.name} sacude la cabeza y resiste el hechizo de dormir. [Salvación CON: ${enemySave} vs CD 13 → Éxito]`,
            type: 'info',
          });
        }
      }
      executeEnemyTurn(enemy.currentHp);
      return;
    }

    // Standard attack / spell damage roll
    sounds.playDiceRoll();
    const d20 = rollD20(adv);
    const totalRoll = d20.d20 + mod + prof + weaponUpgrade;

    // Rogue Sneak Attack bonus crit condition: 19 or 20
    let isCrit = d20.isCrit;
    if (player.classType === 'Pícaro' && d20.d20 >= 19) {
      isCrit = true;
    }

    let resolution = evaluateAttackRoll(d20.d20, totalRoll, enemy.ac);
    if (isCrit) resolution = 'crit';

    const logStr = formatAttackRollLog({
      d20: d20.d20,
      mod,
      prof,
      extraBonus: weaponUpgrade,
      total: totalRoll,
      targetAC: enemy.ac,
      resolution,
      advantage: adv,
    });

    if (resolution === 'crit' || resolution === 'hit' || resolution === 'partial') {
      // Awakening enemy if sleeping
      if (hasEnemyStatus('asleep')) {
        setEnemyStatus((prev) => prev.filter((s) => s.type !== 'asleep'));
        addLog({ text: `El golpe despierta a ${enemy.name}.`, type: 'info' });
      }

      // Damage calculation
      const diceConfig = ability.damageDice || player.equippedWeapon.baseDamageDice || { count: 1, sides: 8 };
      let diceCount = isCrit ? diceConfig.count * 2 : diceConfig.count;
      let rolledDmg = rollDice(diceCount, diceConfig.sides).total;

      // Add attribute mod + half level bonus
      const levelBonus = Math.floor(player.level / 2);
      let totalDmg = rolledDmg + mod + levelBonus + weaponUpgrade;

      // Hunter's mark bonus
      if (hasPlayerStatus('hunter_mark')) {
        const hmDice = isCrit ? 2 : 1;
        totalDmg += rollDice(hmDice, 6).total;
      }

      // Rogue sneak attack (+2d6 with advantage)
      if (player.classType === 'Pícaro' && (adv === 'advantage' || hasEnemyStatus('stunned'))) {
        const sneakCount = isCrit ? 4 : 2;
        const sneakDmg = rollDice(sneakCount, 6).total;
        totalDmg += sneakDmg;
        addLog({ text: `¡Ataque Furtivo letal inflige +${sneakDmg} de daño extra!`, type: 'crit' });
      }

      // Partial damage halved
      if (resolution === 'partial') {
        totalDmg = Math.max(1, Math.floor(totalDmg / 2));
      }

      if (isCrit) {
        sounds.playCrit();
      } else {
        sounds.playHit();
      }

      triggerFloatingText('enemy', `-${totalDmg}`, isCrit);

      // Status effects application on hit
      if (ability.effectType === 'poison') {
        setEnemyStatus((prev) => [...prev, { type: 'poisoned', name: 'Envenenado', duration: 2 }]);
        addLog({ text: `${enemy.name} ha sido envenenado por 2 turnos.`, type: 'status' });
      }
      if (ability.effectType === 'stun') {
        setEnemyStatus((prev) => [...prev, { type: 'stunned', name: 'Aturdido', duration: 1 }]);
        addLog({ text: `¡${enemy.name} queda aturdido por el impacto y pierde su siguiente turno!`, type: 'status' });
      }

      // Apply damage
      const nextEnemyHp = Math.max(0, enemy.currentHp - totalDmg);
      setEnemy((prev) => ({ ...prev, currentHp: nextEnemyHp }));

      addLog({
        text: `Usas ${ability.name}: ${logStr} e infliges ${totalDmg} de daño.`,
        type: isCrit ? 'crit' : resolution === 'partial' ? 'partial' : 'player_atk',
        rollDetails: logStr,
      });

      // Enemy defeated check
      if (nextEnemyHp <= 0) {
        sounds.playFanfare();
        setIsCombatOver(true);
        addLog({ text: `¡Has derrotado a ${enemy.name}!`, type: 'info' });
        setTimeout(() => {
          onVictory(
            {
              ...player,
              currentHp: playerHp,
              currentEnergy: playerEnergy,
            },
            enemy.xpReward,
            enemy.goldReward
          );
        }, 1000);
        return;
      }

      executeEnemyTurn(nextEnemyHp);
    } else {
      // Miss or fumble
      addLog({
        text: `Usas ${ability.name}: ${logStr}`,
        type: resolution === 'fumble' ? 'fumble' : 'info',
        rollDetails: logStr,
      });
      executeEnemyTurn(enemy.currentHp);
    }
  };

  // Use consumable item in combat
  const handleUseItem = (item: ConsumableItem, index: number) => {
    if (!isPlayerTurn || isCombatOver) return;

    if (item.type === 'potion_heal' && item.healAmount) {
      sounds.playHeal();
      const actual = Math.min(player.maxHp - playerHp, item.healAmount);
      setPlayerHp((prev) => Math.min(player.maxHp, prev + item.healAmount!));
      triggerFloatingText('player', `+${actual}`, false, true);
      addLog({ text: `Bebes ${item.name} y recuperas ${actual} HP.`, type: 'heal' });
    } else if (item.type === 'potion_energy' && item.energyAmount) {
      sounds.playSpellCast();
      setPlayerEnergy((prev) => Math.min(player.maxEnergy, prev + item.energyAmount!));
      addLog({ text: `Bebes ${item.name} y restauras ${item.energyAmount} puntos de energía.`, type: 'info' });
    }

    // Remove from player inventory
    player.inventory.splice(index, 1);
    setShowItemPicker(false);
    setIsPlayerTurn(false);
    executeEnemyTurn(enemy.currentHp);
  };

  // Attempt to flee
  const handleFleeAttempt = () => {
    if (!isPlayerTurn || isCombatOver) return;
    sounds.playDiceRoll();
    setIsPlayerTurn(false);

    // Escape with disadvantage vs DC 12
    const d20 = rollD20('disadvantage');
    const dexMod = getModifier(player.attributes.DEX);
    const total = d20.d20 + dexMod;

    if (total >= 12) {
      sounds.playFanfare();
      addLog({
        text: `¡Lograste escabullirte entre las sombras! [d20 con desventaja: ${d20.d20} + ${dexMod} = ${total} vs CD 12 → Éxito]`,
        type: 'info',
      });
      setTimeout(onFlee, 1000);
    } else {
      sounds.playHit();
      addLog({
        text: `¡El intento de huida fracasó! [d20 con desventaja: ${d20.d20} + ${dexMod} = ${total} vs CD 12 → Fallo]`,
        type: 'info',
      });
      executeEnemyTurn(enemy.currentHp);
    }
  };

  const enemyStatusInfo = getEnemyHpStatus(enemy.currentHp, enemy.maxHp);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-4xl mx-auto w-full select-none" data-testid="combat-arena">
      {/* Enemy Stage Cluster */}
      <div className="relative w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-6 flex flex-col items-center justify-center shadow-2xl overflow-hidden mb-4">
        <div className="absolute inset-0 bg-radial from-rose-950/20 via-zinc-950/80 to-zinc-950 pointer-events-none" />

        {/* Floating text indicators */}
        {floatingDamage && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 font-title font-bold text-3xl sm:text-4xl animate-bounce pointer-events-none z-20 ${
              floatingDamage.isHeal
                ? 'text-emerald-400 text-glow-amber'
                : floatingDamage.isCrit
                ? 'text-yellow-400 text-glow-amber scale-125'
                : 'text-rose-500 text-glow-red'
            } ${floatingDamage.target === 'player' ? 'left-8' : 'right-8'}`}
          >
            {floatingDamage.text}
          </div>
        )}

        {/* Boss Crown or Enemy Header */}
        <div className="flex items-center gap-2 mb-2 z-10">
          <span className="font-title font-bold text-xl sm:text-2xl text-zinc-100 text-glow-amber text-center">
            {enemy.name}
          </span>
          {enemy.isBoss && (
            <span className="px-2 py-0.5 rounded bg-rose-600/80 text-white text-[10px] font-bold uppercase tracking-wider">
              Jefe de Campamento
            </span>
          )}
        </div>

        {/* Enemy Vitality & Status (Hiding exact numbers, only qualitative state!) */}
        <div className="w-full max-w-md z-10 flex flex-col items-center gap-2">
          <div className="flex justify-between items-center w-full text-xs font-cinzel">
            <span className="text-zinc-400">Estado de Vitalidad:</span>
            <span className={`font-bold ${enemyStatusInfo.color}`}>
              {enemyStatusInfo.status}
            </span>
          </div>

          {/* Qualitative Progress Bar with no numbers */}
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${
                enemyStatusInfo.percentage > 50
                  ? 'bg-amber-500'
                  : enemyStatusInfo.percentage > 20
                  ? 'bg-orange-600'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${enemyStatusInfo.percentage}%` }}
            />
          </div>

          {/* Active Enemy Status Effects */}
          {enemyStatus.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {enemyStatus.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[10px] font-mono flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {s.name} ({s.duration}t)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Combat Log Box */}
      <div className="flex-1 min-h-[160px] max-h-[220px] bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-4 overflow-y-auto mb-4 font-mono text-xs shadow-inner">
        <div className="space-y-1.5">
          {combatLogs.map((log) => {
            let textColor = 'text-zinc-300';
            if (log.type === 'player_atk') textColor = 'text-amber-300';
            if (log.type === 'enemy_atk') textColor = 'text-rose-400';
            if (log.type === 'crit') textColor = 'text-yellow-400 font-bold';
            if (log.type === 'partial') textColor = 'text-orange-300';
            if (log.type === 'fumble') textColor = 'text-red-500 font-bold';
            if (log.type === 'heal') textColor = 'text-emerald-400 font-bold';
            if (log.type === 'status') textColor = 'text-purple-300';

            return (
              <div key={log.id} className={`flex items-start gap-1.5 ${textColor}`}>
                <CornerDownRight className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                <span>{log.text}</span>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Action Command Center */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider font-cinzel font-bold text-zinc-400">
            {isCombatOver
              ? 'Combate Finalizado'
              : isPlayerTurn
              ? 'Tu Turno: Elige tu Acción'
              : `Turno de ${enemy.name}...`}
          </span>

          <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Energía / Magia: {playerEnergy}/{player.maxEnergy}</span>
          </span>
        </div>

        {/* Action Buttons Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {player.abilities.map((ability) => {
            const hasEnergy = ability.cost === 0 || playerEnergy >= ability.cost;
            const canClick = isPlayerTurn && !isCombatOver && hasEnergy;

            return (
              <button
                key={ability.id}
                type="button"
                disabled={!canClick}
                onClick={() => handlePlayerAction(ability)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  canClick
                    ? ability.cost === 0
                      ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 hover:border-amber-500/60 text-zinc-100 shadow-md active:scale-98'
                      : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-600/50 hover:border-amber-400 text-amber-100 shadow-md active:scale-98'
                    : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 cursor-not-allowed opacity-50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-cinzel font-bold text-xs truncate max-w-[110px]">
                      {ability.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        ability.cost === 0
                          ? 'bg-zinc-700 text-zinc-300'
                          : 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                      }`}
                    >
                      {ability.cost === 0 ? 'Gratis' : `${ability.cost} Magia`}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2">
                    {ability.damageDice
                      ? `${ability.damageDice.count}d${ability.damageDice.sides} + mod`
                      : ability.description}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Consumable Items Button */}
          <button
            type="button"
            disabled={!isPlayerTurn || isCombatOver}
            onClick={() => setShowItemPicker(!showItemPicker)}
            className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-left flex flex-col justify-between text-zinc-200 transition-all cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-cinzel font-bold text-xs">Usar Objeto</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
                {player.inventory.length} en bolsa
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Pociones de vida y elixires</p>
          </button>

          {/* Flee Button */}
          <button
            type="button"
            disabled={!isPlayerTurn || isCombatOver}
            onClick={handleFleeAttempt}
            className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left flex flex-col justify-between text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-cinzel font-bold text-xs">Huir</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                DEX CD 12
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">Tirada con desventaja</p>
          </button>
        </div>

        {/* Item Picker Flyout */}
        {showItemPicker && (
          <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-cinzel font-bold text-zinc-300 block mb-1">
              Selecciona un consumible de tu inventario:
            </span>
            {player.inventory.length === 0 ? (
              <p className="text-xs text-zinc-500">No tienes objetos consumibles en tu mochila.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {player.inventory.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => handleUseItem(item, idx)}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-left text-xs flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-amber-200">{item.name}</span>
                      <p className="text-[10px] text-zinc-400">{item.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
