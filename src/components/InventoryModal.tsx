/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { calculateAC, getModifier, getProficiency } from '../game/rules';
import { Ability, AttributeKey, ConsumableItem, PlayerCharacter } from '../game/types';
import { sounds } from '../utils/audio';
import {
  AlertCircle,
  Backpack,
  BookOpen,
  Check,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface InventoryModalProps {
  player: PlayerCharacter;
  onClose: () => void;
  onUpdatePlayer: (updated: PlayerCharacter) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onClose,
  onUpdatePlayer,
}) => {
  const [tab, setTab] = useState<'sheet' | 'skills' | 'inventory'>('sheet');
  const [replaceSkillTarget, setReplaceSkillTarget] = useState<{
    newAbility: Ability;
    bookItemIndex: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const dexMod = getModifier(player.attributes.DEX);
  const currentAC = calculateAC(
    player.equippedArmor.armorType || 'none',
    dexMod,
    !!player.equippedShield,
    player.equippedArmor.bonusAC || 0
  );
  const prof = getProficiency(player.level);

  // Drink potion outside combat
  const handleUseConsumable = (item: ConsumableItem, index: number) => {
    if (item.type === 'potion_heal' && item.healAmount) {
      sounds.playHeal();
      const actual = Math.min(player.maxHp - player.currentHp, item.healAmount);
      const newInv = [...player.inventory];
      newInv.splice(index, 1);
      onUpdatePlayer({
        ...player,
        currentHp: Math.min(player.maxHp, player.currentHp + item.healAmount),
        inventory: newInv,
      });
      setFeedback(`Has recuperado +${actual} HP.`);
    } else if (item.type === 'potion_energy' && item.energyAmount) {
      sounds.playSpellCast();
      const newInv = [...player.inventory];
      newInv.splice(index, 1);
      onUpdatePlayer({
        ...player,
        currentEnergy: Math.min(player.maxEnergy, player.currentEnergy + item.energyAmount),
        inventory: newInv,
      });
      setFeedback(`Has restaurado +${item.energyAmount} de Magia/Energía.`);
    } else if (item.teachesAbility) {
      // Learn ability
      handleLearnBook(item, index);
    }
  };

  // Attempt to learn ability from Tome/Scroll
  const handleLearnBook = (item: ConsumableItem, index: number) => {
    const ability = item.teachesAbility;
    if (!ability) return;

    // Check class restriction
    if (ability.allowedClasses && !ability.allowedClasses.includes(player.classType)) {
      setFeedback(
        `Tu clase (${player.classType}) no puede aprender este escrito arcano/marcial. Puedes venderlo en la tienda del campamento por ${Math.floor(item.value * 0.75)} de oro.`
      );
      return;
    }

    // Check duplicate
    if (player.abilities.some((a) => a.id === ability.id)) {
      setFeedback('Ya dominas esta habilidad en tu repertorio.');
      return;
    }

    // Check limit of 6 abilities
    if (player.abilities.length >= 6) {
      setReplaceSkillTarget({ newAbility: ability, bookItemIndex: index });
      setFeedback('Ya conoces el límite máximo de 6 habilidades. Elige cuál deseas olvidar para aprender esta nueva.');
      return;
    }

    // Learn directly
    sounds.playFanfare();
    const newInv = [...player.inventory];
    newInv.splice(index, 1);
    onUpdatePlayer({
      ...player,
      abilities: [...player.abilities, ability],
      inventory: newInv,
    });
    setFeedback(`¡Has aprendido [${ability.name}] con éxito!`);
  };

  // Replace existing skill with new one
  const handleConfirmReplaceSkill = (skillToForgetIndex: number) => {
    if (!replaceSkillTarget) return;
    sounds.playFanfare();

    const newAbilities = [...player.abilities];
    const forgotten = newAbilities[skillToForgetIndex];
    newAbilities[skillToForgetIndex] = replaceSkillTarget.newAbility;

    const newInv = [...player.inventory];
    newInv.splice(replaceSkillTarget.bookItemIndex, 1);

    onUpdatePlayer({
      ...player,
      abilities: newAbilities,
      inventory: newInv,
    });
    setFeedback(`Has olvidado [${forgotten.name}] y aprendido [${replaceSkillTarget.newAbility.name}].`);
    setReplaceSkillTarget(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none"
      data-testid="inventory-modal"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Backpack className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-cinzel font-bold text-zinc-100">
              Panel del Aventurero: {player.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 gap-2">
          <button
            onClick={() => {
              setTab('sheet');
              setReplaceSkillTarget(null);
            }}
            className={`py-3 px-4 font-cinzel text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              tab === 'sheet'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ficha & Atributos
          </button>
          <button
            onClick={() => setTab('skills')}
            className={`py-3 px-4 font-cinzel text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              tab === 'skills'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Libro de Habilidades ({player.abilities.length}/6)
          </button>
          <button
            onClick={() => {
              setTab('inventory');
              setReplaceSkillTarget(null);
            }}
            className={`py-3 px-4 font-cinzel text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              tab === 'inventory'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mochila de Objetos ({player.inventory.length})
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className="px-6 py-2.5 bg-amber-950/40 border-b border-amber-600/40 text-amber-300 text-xs flex justify-between items-center">
            <span>{feedback}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-amber-400 hover:text-amber-200 text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CHARACTER SHEET & STATS */}
          {tab === 'sheet' && (
            <div className="space-y-6">
              {/* Primary metrics tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-500 block mb-1">
                    Puntos de Golpe
                  </span>
                  <span className="text-xl font-bold font-mono text-rose-400">
                    {player.currentHp} / {player.maxHp}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-500 block mb-1">
                    Energía / Magia
                  </span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {player.currentEnergy} / {player.maxEnergy}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-500 block mb-1">
                    Clase de Armadura
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    CA {currentAC}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-500 block mb-1">
                    Competencia
                  </span>
                  <span className="text-xl font-bold font-mono text-zinc-200">
                    +{prof}
                  </span>
                </div>
              </div>

              {/* Attributes Table */}
              <div>
                <span className="text-xs uppercase tracking-wider font-cinzel font-bold text-zinc-400 block mb-3">
                  Atributos y Modificadores
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {(Object.keys(player.attributes) as AttributeKey[]).map((attr) => {
                    const val = player.attributes[attr];
                    const mod = getModifier(val);
                    return (
                      <div
                        key={attr}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center"
                      >
                        <span className="text-xs font-bold text-zinc-400 block">{attr}</span>
                        <span className="text-lg font-bold font-mono text-zinc-100">{val}</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equipped Gear Details */}
              <div>
                <span className="text-xs uppercase tracking-wider font-cinzel font-bold text-zinc-400 block mb-3">
                  Equipo Activo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="font-cinzel font-bold text-amber-300 block">Arma Equipada</span>
                    <p className="text-zinc-200 font-medium mt-1">
                      {player.equippedWeapon.name}
                    </p>
                    <p className="text-zinc-400 mt-0.5">
                      Daño base: {player.equippedWeapon.baseDamageDice?.count}d{player.equippedWeapon.baseDamageDice?.sides} (+{player.equippedWeapon.upgradeLevel} mejora)
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="font-cinzel font-bold text-amber-300 block">Armadura y Escudo</span>
                    <p className="text-zinc-200 font-medium mt-1">
                      {player.equippedArmor.name}
                    </p>
                    <p className="text-zinc-400 mt-0.5">
                      {player.equippedShield
                        ? `Con ${player.equippedShield.name} (+2 CA)`
                        : 'Sin escudo adicional'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS REPERTOIRE */}
          {tab === 'skills' && (
            <div className="space-y-4">
              {replaceSkillTarget && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 space-y-2">
                  <span className="font-cinzel font-bold text-amber-300 block text-xs">
                    Reemplazar una habilidad para aprender [{replaceSkillTarget.newAbility.name}]:
                  </span>
                  <p className="text-xs text-zinc-300">
                    Haz clic en la habilidad que deseas olvidar para sustituirla por la nueva:
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {player.abilities.map((ability, idx) => (
                  <div
                    key={ability.id}
                    className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-cinzel font-bold text-sm text-zinc-100">
                          {ability.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                          {ability.cost === 0 ? 'Gratis' : `${ability.cost} Magia`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">{ability.description}</p>
                    </div>

                    {replaceSkillTarget && idx > 0 && (
                      <button
                        onClick={() => handleConfirmReplaceSkill(idx)}
                        className="mt-3 py-1.5 px-3 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-cinzel font-bold cursor-pointer transition-colors"
                      >
                        Olvidar esta habilidad
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY ITEMS */}
          {tab === 'inventory' && (
            <div className="space-y-3">
              {player.inventory.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-medieval">
                  Tu mochila está vacía. Encuentra botines en salas seguras o compra consumibles en el campamento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {player.inventory.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-cinzel font-bold text-sm text-amber-200">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            Valor: {item.value} 🪙
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">{item.description}</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                        {item.teachesAbility ? (
                          <button
                            onClick={() => handleLearnBook(item, idx)}
                            className="py-1.5 px-3 rounded bg-purple-900/60 hover:bg-purple-800 border border-purple-600 text-purple-200 text-xs font-cinzel font-bold cursor-pointer transition-colors"
                          >
                            Estudiar / Aprender
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUseConsumable(item, idx)}
                            className="py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-cinzel font-bold cursor-pointer transition-colors"
                          >
                            Usar ahora
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
