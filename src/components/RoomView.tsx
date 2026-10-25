/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  evaluateAttackRoll,
  formatAttackRollLog,
  getModifier,
  getProficiency,
  rollD20,
  rollDice,
} from '../game/rules';
import {
  AttributeKey,
  CombatLogEntry,
  ConsumableItem,
  EventOption,
  PlayerCharacter,
  Room,
} from '../game/types';
import { sounds } from '../utils/audio';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Flame,
  Gift,
  HandMetal,
  HelpCircle,
  Key,
  Shield,
  Sparkles,
  Swords,
  XCircle,
} from 'lucide-react';

interface RoomViewProps {
  room: Room;
  player: PlayerCharacter;
  onEnterCombat: () => void;
  onRoomResolved: (updates: {
    hpDelta?: number;
    expeditionGoldDelta?: number;
    xpDelta?: number;
    acquiredItem?: ConsumableItem;
    equipmentUpgrade?: boolean;
    logs?: CombatLogEntry[];
  }) => void;
  onNextRoom: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  room,
  player,
  onEnterCombat,
  onRoomResolved,
  onNextRoom,
}) => {
  const [trapResolved, setTrapResolved] = useState<boolean>(false);
  const [trapResultMsg, setTrapResultMsg] = useState<{ text: string; success: boolean; damage?: number } | null>(null);
  const [eventResolved, setEventResolved] = useState<boolean>(false);
  const [eventResultMsg, setEventResultMsg] = useState<string | null>(null);
  const [chestOpened, setChestOpened] = useState<boolean>(false);

  // Trap handler
  const handleTriggerTrap = () => {
    if (!room.trap) return;
    sounds.playDiceRoll();

    const attr = room.trap.attributeCheck;
    const mod = getModifier(player.attributes[attr]);
    const prof = getProficiency(player.level);
    const d20 = rollD20('normal');
    const total = d20.d20 + mod + prof;
    const isSuccess = total >= room.trap.dc;

    if (isSuccess) {
      sounds.playFanfare();
      setTrapResultMsg({
        text: `${room.trap.avoidSuccessMsg} [d20: ${d20.d20} + ${mod} + ${prof} = ${total} vs CD ${room.trap.dc}]`,
        success: true,
      });
      onRoomResolved({ xpDelta: 25 });
    } else {
      sounds.playHit(true);
      const dmg = rollDice(room.trap.failureDamageDice.count, room.trap.failureDamageDice.sides).total;
      setTrapResultMsg({
        text: `${room.trap.failureMsg} Recibes ${dmg} de daño. [d20: ${d20.d20} + ${mod} + ${prof} = ${total} vs CD ${room.trap.dc}]`,
        success: false,
        damage: dmg,
      });
      onRoomResolved({ hpDelta: -dmg });
    }
    setTrapResolved(true);
  };

  // Event choice handler
  const handleEventChoice = (option: EventOption) => {
    sounds.playDiceRoll();

    if (option.check) {
      const mod = getModifier(player.attributes[option.check.attribute]);
      const prof = getProficiency(player.level);
      const d20 = rollD20('normal');
      const total = d20.d20 + mod + prof;
      const success = total >= option.check.dc;

      if (success) {
        sounds.playFanfare();
        setEventResultMsg(`${option.successResult.msg} [Tirada exitosa: ${total} vs CD ${option.check.dc}]`);
        onRoomResolved({
          hpDelta: option.successResult.hpDelta,
          expeditionGoldDelta: option.successResult.gold,
          acquiredItem: option.successResult.item,
          xpDelta: option.successResult.xp || 25,
        });
      } else {
        sounds.playHit();
        const failMsg = option.failureResult?.msg || 'La acción no tuvo el resultado deseado.';
        setEventResultMsg(`${failMsg} [Tirada fallida: ${total} vs CD ${option.check.dc}]`);
        onRoomResolved({
          hpDelta: option.failureResult?.hpDelta,
          expeditionGoldDelta: option.failureResult?.goldLoss ? -option.failureResult.goldLoss : 0,
        });
      }
    } else {
      // Deterministic choice
      sounds.playCoin();
      setEventResultMsg(option.successResult.msg);
      onRoomResolved({
        hpDelta: option.successResult.hpDelta,
        expeditionGoldDelta: option.successResult.gold,
        acquiredItem: option.successResult.item,
        xpDelta: option.successResult.xp || 20,
      });
    }
    setEventResolved(true);
  };

  // Safe room loot opener
  const handleOpenChest = () => {
    sounds.playCoin();
    setChestOpened(true);
    if (room.loot) {
      onRoomResolved({
        expeditionGoldDelta: room.loot.gold,
        acquiredItem: room.loot.item,
        equipmentUpgrade: room.loot.equipmentUpgrade,
        xpDelta: 20,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 max-w-4xl mx-auto w-full select-none">
      {/* Room Graphic Canvas / SVG Banner */}
      <div className="w-full relative h-48 sm:h-64 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
        {/* Dungeon stone background texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-950/80 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

        {/* Ambient Torches */}
        <div className="absolute top-6 left-8 flex flex-col items-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping opacity-75" />
          <Flame className="w-8 h-8 text-amber-500 -mt-2 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
          <div className="w-1.5 h-6 bg-zinc-700 rounded-sm" />
        </div>
        <div className="absolute top-6 right-8 flex flex-col items-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping opacity-75" />
          <Flame className="w-8 h-8 text-amber-500 -mt-2 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
          <div className="w-1.5 h-6 bg-zinc-700 rounded-sm" />
        </div>

        {/* Central Thematic Iconography */}
        <div className="z-10 text-center flex flex-col items-center">
          {room.type === 'combat' && (
            <div className="relative">
              <Swords className="w-16 h-16 sm:w-20 sm:h-20 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse" />
              {room.isBossRoom && (
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white uppercase tracking-wider">
                  Jefe
                </span>
              )}
            </div>
          )}
          {room.type === 'trap' && (
            <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse" />
          )}
          {room.type === 'event' && (
            <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.6)]" />
          )}
          {room.type === 'safe' && (
            <Gift className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
          )}

          <h2 className="mt-3 text-xl sm:text-2xl font-title font-bold text-zinc-100 text-glow-amber">
            {room.title}
          </h2>
          <span className="text-xs uppercase tracking-widest font-cinzel text-zinc-500 mt-1">
            {room.type === 'combat' && 'Encuentro Hostil'}
            {room.type === 'trap' && 'Peligro Mortal'}
            {room.type === 'event' && 'Evento Misterioso'}
            {room.type === 'safe' && 'Refugio & Tesoro'}
          </span>
        </div>
      </div>

      {/* Room Description & Interactive Context */}
      <div className="w-full my-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-medieval">
          {room.description}
        </p>

        {/* COMBAT ROOM ENCOUNTER */}
        {room.type === 'combat' && room.enemy && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-rose-300 text-lg">
                  {room.enemy.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs text-zinc-400 font-mono">
                  CA {room.enemy.ac}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{room.enemy.description}</p>
            </div>

            <button
              onClick={() => {
                sounds.playDiceRoll();
                onEnterCombat();
              }}
              data-start="true"
              className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-cinzel font-bold text-base shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Swords className="w-5 h-5" />
              <span>Entrar en Combate</span>
            </button>
          </div>
        )}

        {/* TRAP ROOM ENCOUNTER */}
        {room.type === 'trap' && room.trap && (
          <div className="mt-6 space-y-4">
            {!trapResolved ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
                <p className="text-xs text-amber-300 mb-3 font-semibold">
                  Se requiere una salvación de {room.trap.attributeCheck} contra Dificultad (CD) {room.trap.dc}.
                </p>
                <button
                  onClick={handleTriggerTrap}
                  className="w-full py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-cinzel font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Realizar Tirada de Salvación ({room.trap.attributeCheck})</span>
                </button>
              </div>
            ) : (
              <div
                className={`p-4 rounded-xl border flex flex-col gap-3 ${
                  trapResultMsg?.success
                    ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {trapResultMsg?.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>{trapResultMsg?.text}</span>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={onNextRoom}
                    className="py-2.5 px-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-cinzel text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar al Siguiente Corredor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVENT ROOM ENCOUNTER */}
        {room.type === 'event' && room.event && (
          <div className="mt-6 space-y-4">
            {!eventResolved ? (
              <div className="space-y-2">
                <span className="text-xs font-cinzel font-bold text-purple-400 uppercase tracking-wider block mb-2">
                  ¿Qué decides hacer?
                </span>
                {room.event.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleEventChoice(opt)}
                    className="w-full p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/60 text-left text-xs sm:text-sm text-zinc-200 hover:text-purple-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.text}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-600/40 text-purple-200 space-y-3">
                <p className="text-sm font-medium">{eventResultMsg}</p>
                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={onNextRoom}
                    className="py-2.5 px-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-cinzel text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar la Expedición</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SAFE ROOM ENCOUNTER */}
        {room.type === 'safe' && (
          <div className="mt-6">
            {!chestOpened ? (
              <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-center flex flex-col items-center">
                <p className="text-xs sm:text-sm text-emerald-300 mb-4">
                  El cofre de madera reforzada con herrajes de bronce no parece tener trampas.
                </p>
                <button
                  onClick={handleOpenChest}
                  className="py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-cinzel font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  <Key className="w-4 h-4" />
                  <span>Abrir Cofre y Recoger Botín</span>
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-zinc-200 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-cinzel font-bold">
                  <CheckCircle className="w-5 h-5" />
                  <span>¡Has encontrado valiosos pertrechos!</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {room.loot && (
                    <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800 flex justify-between items-center">
                      <span className="text-amber-400 font-semibold">Oro de Expedición Encontrado:</span>
                      <span className="font-mono text-amber-300 font-bold">+{room.loot.gold} 🪙</span>
                    </div>
                  )}

                  {room.loot?.item && (
                    <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800 flex justify-between items-center">
                      <span className="text-purple-300 font-semibold">Objeto: {room.loot.item.name}</span>
                      <span className="text-[11px] text-zinc-400">{room.loot.item.description}</span>
                    </div>
                  )}

                  {room.loot?.equipmentUpgrade && (
                    <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800 text-emerald-300">
                      <span>✨ ¡Piedra de Afilado / Forja Rúnica hallada! Puedes mejorar tu equipo en el campamento.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={onNextRoom}
                    className="py-2.5 px-6 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-cinzel text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continuar al Próximo Desafío</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
