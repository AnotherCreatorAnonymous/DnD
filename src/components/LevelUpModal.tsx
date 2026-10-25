/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerCharacter } from '../game/types';
import { sounds } from '../utils/audio';
import { Award, Check, Sparkles, TrendingUp } from 'lucide-react';

interface LevelUpModalProps {
  player: PlayerCharacter;
  newLevel: number;
  hpGained: number;
  energyGained: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  player,
  newLevel,
  hpGained,
  energyGained,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-300"
      data-testid="levelup-modal"
    >
      <div className="bg-zinc-950 border border-amber-500/60 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center relative overflow-hidden">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-950/60 border border-amber-500/60 flex items-center justify-center shadow-lg animate-pulse">
          <Award className="w-12 h-12 text-amber-400" />
        </div>

        <span className="text-xs font-cinzel font-bold text-amber-500 uppercase tracking-widest block mb-1">
          ¡Aumento de Poder!
        </span>
        <h2 className="text-3xl font-title font-bold text-amber-100 text-glow-amber mb-2">
          ¡Nivel {newLevel} Alcanzado!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-medieval mb-6">
          Tu experiencia en las profundidades endurece tus músculos y agudiza tus instintos heroicos.
        </p>

        {/* Improvements breakdown */}
        <div className="space-y-2 mb-6 text-xs text-left">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
            <span className="text-zinc-300">Puntos de Golpe Máximos:</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">+{hpGained} HP</span>
          </div>

          {energyGained > 0 && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-300">Reserva de Energía / Magia:</span>
              <span className="text-cyan-400 font-mono font-bold text-sm">+{energyGained} Máx</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
            <span className="text-zinc-300">Bonificador de Daño Heroico:</span>
            <span className="text-amber-400 font-mono font-bold text-sm">
              +{Math.floor(newLevel / 2)} daño extra
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playDiceRoll();
            onClose();
          }}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-cinzel font-bold text-base shadow-lg cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Continuar Aventura</span>
        </button>
      </div>
    </div>
  );
};
