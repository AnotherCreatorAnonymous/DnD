/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerCharacter, Room } from '../game/types';
import { getXpForNextLevel } from '../game/rules';
import { Shield, Sparkles, Heart, Zap, Backpack, Volume2, VolumeX, Flame } from 'lucide-react';

interface DungeonHeaderProps {
  player: PlayerCharacter;
  room: Room;
  onOpenInventory: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const DungeonHeader: React.FC<DungeonHeaderProps> = ({
  player,
  room,
  onOpenInventory,
  isMuted,
  onToggleMute,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.currentHp / player.maxHp) * 100));
  const energyPercent = Math.max(0, Math.min(100, (player.currentEnergy / player.maxEnergy) * 100));
  const xpNeeded = getXpForNextLevel(player.level);
  const xpPercent = Math.max(0, Math.min(100, (player.xp / xpNeeded) * 100));

  return (
    <header className="w-full bg-zinc-950/95 border-b border-zinc-800/80 backdrop-blur-sm sticky top-0 z-30 px-3 sm:px-6 py-2.5 select-none">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Character Info & Dungeon Milestones */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <span className="font-title font-bold text-base sm:text-lg text-amber-100 truncate max-w-[140px] sm:max-w-[200px]">
              {player.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-amber-400 font-mono">
              Nv.{player.level} {player.classType}
            </span>
          </div>

          {/* Room Camp Progress Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-cinzel font-bold border ${
              room.isBossRoom
                ? 'bg-rose-950/50 border-rose-500/80 text-rose-300 animate-pulse'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${room.isBossRoom ? 'text-rose-400' : 'text-amber-500'}`} />
            <span>
              Sala {room.subIndex}/{room.totalForCamp} {room.isBossRoom ? '(¡JEFE!)' : 'al campamento'}
            </span>
          </div>
        </div>

        {/* Meters: HP, Energy, XP */}
        <div className="flex items-center gap-3 sm:gap-6 w-full md:w-auto flex-1 max-w-xl">
          {/* Health Bar */}
          <div className="flex-1">
            <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <Heart className="w-3 h-3 fill-rose-500" />
                <span>HP</span>
              </span>
              <span className="text-zinc-200">
                {player.currentHp}/{player.maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
              <div
                className="h-full bg-rose-600 transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Energy / Magic Bar */}
          <div className="w-24 sm:w-32">
            <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                <Zap className="w-3 h-3 fill-cyan-400" />
                <span>MAG</span>
              </span>
              <span className="text-zinc-200">
                {player.currentEnergy}/{player.maxEnergy}
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          {/* XP Bar */}
          <div className="w-20 sm:w-28 hidden sm:block">
            <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
              <span className="text-purple-400 font-semibold">XP</span>
              <span className="text-zinc-400">
                {player.xp}/{xpNeeded}
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency & Utility buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full md:w-auto text-xs">
          {/* Gold Counters */}
          <div className="flex items-center gap-2">
            <div
              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1.5"
              title="Oro Seguro en el Banco (se conserva al morir)"
            >
              <span className="text-amber-400 font-bold font-mono">💰 {player.safeGold}</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">Seguro</span>
            </div>
            <div
              className="px-2 py-1 rounded bg-amber-950/40 border border-amber-600/40 flex items-center gap-1.5"
              title="Oro de Expedición (en riesgo, se asegura al llegar al campamento)"
            >
              <span className="text-amber-300 font-bold font-mono">⚠️ +{player.expeditionGold}</span>
              <span className="text-[10px] text-amber-500/80 hidden sm:inline">Expedición</span>
            </div>
          </div>

          {/* Inventory and Sound buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenInventory}
              title="Abrir Mochila e Inventario [I]"
              className="p-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-amber-400 font-cinzel flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Backpack className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mochila [I]</span>
            </button>
            <button
              onClick={onToggleMute}
              title="Silenciar sonido [M]"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-amber-400 cursor-pointer transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
