/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { sounds } from '../utils/audio';
import { PlayerCharacter } from '../game/types';
import { Shield, Sparkles, Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';

interface TitleScreenProps {
  onStartNewGame: () => void;
  onResumeGame?: () => void;
  savedPlayer?: PlayerCharacter | null;
  savedCampIndex?: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartNewGame,
  onResumeGame,
  savedPlayer,
  savedCampIndex = 0,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (savedPlayer && onResumeGame) {
          onResumeGame();
        } else {
          onStartNewGame();
        }
      }
      if (e.key.toLowerCase() === 'm') {
        onToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [savedPlayer, onResumeGame, onStartNewGame, onToggleMute]);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 bg-radial from-zinc-900 via-neutral-950 to-black text-zinc-100 overflow-hidden"
      data-testid="title-screen"
    >
      {/* Ambient background dungeon particles / lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#b91c1c_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top utility bar */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-xs tracking-wider uppercase text-amber-500/80 font-cinzel">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>Supervivencia Infinita D&D</span>
        </div>
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-600/50 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto z-10 max-w-2xl">
        <div className="relative mb-6">
          <svg className="w-24 h-24 mx-auto text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" viewBox="0 0 100 100" fill="none">
            <path
              d="M50 5 L85 22 L85 55 C85 75 50 95 50 95 C50 95 15 75 15 55 L15 22 Z"
              stroke="#d97706"
              strokeWidth="3"
              fill="#18181b"
            />
            <path d="M50 15 L50 85" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M28 35 L72 35" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="50" cy="35" r="5" fill="#f59e0b" />
            <polygon points="50,15 45,25 55,25" fill="#fbbf24" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-6xl font-title tracking-wider text-amber-100 font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-glow-amber">
          MAZMORRA INFINITA
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-md font-medieval">
          Adéntrate en las profundidades por turnos. Salva tus tiradas con dados d20, amasa oro seguro y desafía a los titanes ancestrales.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          {savedPlayer && onResumeGame && (
            <button
              onClick={() => {
                sounds.playDiceRoll();
                onResumeGame();
              }}
              data-start="true"
              className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 font-cinzel font-bold text-lg shadow-[0_0_25px_rgba(217,119,6,0.35)] hover:from-amber-500 hover:to-amber-700 active:scale-98 border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Continuar</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playDiceRoll();
              onStartNewGame();
            }}
            data-start={savedPlayer ? 'false' : 'true'}
            className="flex-1 py-4 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-cinzel font-bold text-lg border border-zinc-700 hover:border-amber-500/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
          >
            <Play className="w-5 h-5 text-amber-400" />
            <span>Nueva Partida</span>
          </button>
        </div>

        {/* Saved game summary badge if available */}
        {savedPlayer && (
          <div className="mt-6 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-3">
            <span className="text-amber-400 font-semibold">{savedPlayer.name}</span>
            <span>·</span>
            <span>{savedPlayer.classType} (Nivel {savedPlayer.level})</span>
            <span>·</span>
            <span className="text-amber-300 font-mono">Oro Seguro: {savedPlayer.safeGold} 🪙</span>
          </div>
        )}
      </div>

      {/* Control Hint Line */}
      <div className="z-10 text-center text-xs text-zinc-500 tracking-wider">
        <span>Enter o Espacio para Iniciar · Tecla M para Silenciar sonido</span>
      </div>
    </div>
  );
};
