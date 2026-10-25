/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerCharacter } from '../game/types';
import { sounds } from '../utils/audio';
import { AlertOctagon, Check, Flame, RotateCcw, Skull, X } from 'lucide-react';

interface DeathViewProps {
  player: PlayerCharacter;
  lostExpeditionGold: number;
  onRevive: () => void;
}

export const DeathView: React.FC<DeathViewProps> = ({
  player,
  lostExpeditionGold,
  onRevive,
}) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-950 via-rose-950/40 to-black text-zinc-100 select-none"
      data-testid="death-screen"
    >
      <div className="max-w-xl w-full bg-zinc-950/90 border border-rose-900/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(225,29,72,0.3)] text-center relative overflow-hidden">
        {/* Glow and Skull */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-950/50 border border-rose-600/40 flex items-center justify-center shadow-lg">
          <Skull className="w-12 h-12 text-rose-500 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-title font-bold text-rose-200 text-glow-red">
          HAS CAÍDO EN COMBATE
        </h1>
        <p className="mt-2 text-sm text-zinc-400 font-medieval">
          La fría oscuridad de la mazmorra reclama tu cuerpo terrenal... pero la magia ancestral del campamento te trae de vuelta a la vida.
        </p>

        {/* Detailed Breakdown: What was lost vs What is preserved */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs">
          {/* Lost panel */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40">
            <span className="font-cinzel font-bold text-rose-400 flex items-center gap-1.5 mb-2">
              <X className="w-4 h-4 text-rose-500" />
              <span>Lo que se pierde:</span>
            </span>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-start gap-1">
                <span className="text-rose-500 font-bold">✕</span>
                <span>
                  Todo el <strong className="text-rose-300">Oro de Expedición</strong> (+{lostExpeditionGold} 🪙)
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Objetos y botines no asegurados recogidos en esta incursión</span>
              </li>
            </ul>
          </div>

          {/* Preserved panel */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <span className="font-cinzel font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Lo que se conserva:</span>
            </span>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-start gap-1">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>
                  Nivel ({player.level}) y Experiencia ({player.xp} XP)
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>
                  Todo el <strong className="text-amber-400">Oro Seguro</strong> en tu banco ({player.safeGold} 🪙)
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Arma y armadura actualmente equipadas</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Todas tus habilidades aprendidas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            sounds.playFanfare();
            onRevive();
          }}
          data-start="true"
          className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-cinzel font-bold text-base shadow-[0_0_25px_rgba(225,29,72,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Revivir en el Campamento</span>
        </button>
      </div>
    </div>
  );
};
