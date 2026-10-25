/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CLASSES_DATA,
  STANDARD_ARRAY,
} from '../game/data';
import {
  calculateAC,
  calculateMaxEnergy,
  calculateMaxHP,
  getModifier,
  getProficiency,
} from '../game/rules';
import {
  Ability,
  AttributeKey,
  Attributes,
  ClassType,
  EquipmentSet,
  PlayerCharacter,
} from '../game/types';
import { sounds } from '../utils/audio';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  Shield,
  Sparkles,
  Swords,
  User,
  Wand2,
} from 'lucide-react';

interface CharacterCreationProps {
  onComplete: (character: PlayerCharacter) => void;
  onCancel: () => void;
}

const DEFAULT_NAMES: Record<ClassType, string[]> = {
  Guerrero: ['Valerius el Férreo', 'Aldor de la Roca', 'Brena Rompeescudos', 'Kaelen de Hierro'],
  Clérigo: ['Hermana Elenor', 'Fray Boros del Sol', 'Sacerdotisa Mireya', 'Lucian Penitente'],
  Pícaro: ['Silas Daga Sombría', 'Kira la Silenciosa', 'Dante Dedosrápidos', 'Vesper Niebla'],
  Mago: ['Maese Ignis', 'Morrigan la Bruja', 'Archibaldo Runa-Azul', 'Selene Astral'],
  Explorador: ['Fenris Cazador', 'Sylvia Rastreabosques', 'Korath Halcón', 'Aeron Espina'],
};

const ATTR_LABELS: Record<AttributeKey, { name: string; desc: string }> = {
  STR: { name: 'Fuerza (STR)', desc: 'Potencia física, ataques de armas cuerpo a cuerpo pesadas' },
  DEX: { name: 'Destreza (DEX)', desc: 'Agilidad, reflejos, armas sutiles, arcos y aumento de CA' },
  CON: { name: 'Constitución (CON)', desc: 'Salud, resistencia y Puntos de Golpe (HP) máximos' },
  INT: { name: 'Inteligencia (INT)', desc: 'Conocimiento arcano, hechizos y trucos de Mago' },
  WIS: { name: 'Sabiduría (WIS)', desc: 'Percepción, intuición y plegarias divinas de Clérigo' },
  CHA: { name: 'Carisma (CHA)', desc: 'Fuerza de personalidad, presencia y liderazgo' },
};

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedClass, setSelectedClass] = useState<ClassType>('Guerrero');
  const [characterName, setCharacterName] = useState<string>('Valerius el Férreo');

  // Standard array assignment
  const [stats, setStats] = useState<Attributes>({
    STR: 15,
    CON: 14,
    DEX: 13,
    WIS: 12,
    CHA: 10,
    INT: 8,
  });

  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(0);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('g_devastador');

  const classDef = CLASSES_DATA[selectedClass];

  // Helper when class changes
  const handleSelectClass = (c: ClassType) => {
    setSelectedClass(c);
    const names = DEFAULT_NAMES[c];
    setCharacterName(names[Math.floor(Math.random() * names.length)]);
    setSelectedSetIndex(0);
    const newDef = CLASSES_DATA[c];
    setSelectedSkillId(newDef.initialSkillChoices[0].id);
    // Auto-apply recommended stats
    setStats({ ...newDef.recommendedStats });
  };

  const handleApplyRecommended = () => {
    sounds.playDiceRoll();
    setStats({ ...classDef.recommendedStats });
  };

  // Change single attribute value
  const handleStatChange = (attr: AttributeKey, value: number) => {
    // If the value is already used in another stat, swap them!
    const oldVal = stats[attr];
    const otherAttr = (Object.keys(stats) as AttributeKey[]).find(
      (k) => k !== attr && stats[k] === value
    );

    const newStats = { ...stats, [attr]: value };
    if (otherAttr) {
      newStats[otherAttr] = oldVal;
    }
    setStats(newStats);
  };

  // Calculations for preview
  const currentSet: EquipmentSet = classDef.equipmentSets[selectedSetIndex] || classDef.equipmentSets[0];
  const dexMod = getModifier(stats.DEX);
  const conMod = getModifier(stats.CON);
  const resultingAC = calculateAC(
    currentSet.armor.armorType || 'none',
    dexMod,
    !!currentSet.shield
  );
  const maxHp = calculateMaxHP(selectedClass, conMod, 1);
  const maxEnergy = calculateMaxEnergy(1);
  const prof = getProficiency(1);

  // Selected special ability
  const chosenSkill =
    classDef.initialSkillChoices.find((s) => s.id === selectedSkillId) ||
    classDef.initialSkillChoices[0];

  const handleFinalize = () => {
    sounds.playFanfare();
    const character: PlayerCharacter = {
      name: characterName.trim() || 'Aventurero Errante',
      classType: selectedClass,
      level: 1,
      xp: 0,
      maxHp,
      currentHp: maxHp,
      maxEnergy,
      currentEnergy: maxEnergy,
      attributes: { ...stats },
      equippedWeapon: { ...currentSet.weapon },
      equippedArmor: { ...currentSet.armor },
      equippedShield: currentSet.shield ? { ...currentSet.shield } : undefined,
      abilities: [classDef.basicAbility, chosenSkill],
      inventory: [
        {
          id: 'pot_init_1',
          name: 'Poción de Curación Menor',
          type: 'potion_heal',
          healAmount: 15,
          value: 25,
          description: 'Restaura 15 puntos de golpe al instante.',
        },
      ],
      statusEffects: [],
      safeGold: 50, // Starting purse
      expeditionGold: 0,
    };
    onComplete(character);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-500 font-cinzel">
            Creación de Personaje · Paso {step} de 4
          </span>
          <h2 className="text-2xl sm:text-3xl font-title font-bold text-zinc-100">
            {step === 1 && '1. Elige tu Clase'}
            {step === 2 && '2. Asigna el Standard Array (15, 14, 13, 12, 10, 8)'}
            {step === 3 && '3. Equipo y Habilidad Inicial'}
            {step === 4 && '4. Ficha Final del Héroe'}
          </h2>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          Volver al Menú
        </button>
      </div>

      {/* STEP 1: CLASS SELECTION */}
      {step === 1 && (
        <div className="py-6 flex-1 flex flex-col">
          <p className="text-sm text-zinc-400 mb-6">
            Cada clase define tus dados de vida, habilidades arcanas o marciales, y tu estilo de juego en las profundidades.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(CLASSES_DATA) as ClassType[]).map((cKey) => {
              const c = CLASSES_DATA[cKey];
              const isSelected = selectedClass === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => {
                    sounds.playDiceRoll();
                    handleSelectClass(cKey);
                  }}
                  className={`p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{c.icon}</span>
                      <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 font-mono text-amber-400">
                        Dado d{c.hitDie} · {c.primaryAttr}
                      </span>
                    </div>
                    <h3 className="text-xl font-cinzel font-bold text-zinc-100 mb-1">{c.title}</h3>
                    <p className="text-xs text-amber-300 font-medium mb-2">{c.role}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Habilidad:</span>
                    <span className="text-zinc-300 font-semibold">{c.basicAbility.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => {
                sounds.playDiceRoll();
                setStep(2);
              }}
              className="py-3 px-8 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-cinzel font-bold text-base flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Continuar a Atributos</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: STANDARD ARRAY STATS */}
      {step === 2 && (
        <div className="py-6 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <p className="text-sm text-zinc-300">
                Distribuye los valores estándar: <span className="font-mono text-amber-400 font-bold">15, 14, 13, 12, 10, 8</span> entre tus seis atributos.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Fórmula de modificador: <span className="font-mono">floor((atributo - 10) / 2)</span>. El valor se actualiza en vivo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyRecommended}
              className="py-2.5 px-4 rounded-lg bg-amber-950/60 border border-amber-600/60 text-amber-300 hover:bg-amber-900/60 hover:text-amber-200 transition-colors flex items-center gap-2 font-cinzel text-sm cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>(Recomendado) Para {selectedClass}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(ATTR_LABELS) as AttributeKey[]).map((attrKey) => {
              const attrInfo = ATTR_LABELS[attrKey];
              const score = stats[attrKey];
              const mod = getModifier(score);
              const isPrimary = classDef.primaryAttr === attrKey;

              return (
                <div
                  key={attrKey}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isPrimary ? 'bg-amber-950/20 border-amber-600/40' : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel font-bold text-zinc-100">{attrInfo.name}</span>
                        {isPrimary && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{attrInfo.desc}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-amber-400">
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                      <span className="block text-[10px] text-zinc-500 uppercase">Modificador</span>
                    </div>
                  </div>

                  {/* Selector for standard array */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <label htmlFor={`stat-${attrKey}`} className="text-xs text-zinc-400">Puntaje Asignado:</label>
                    <select
                      id={`stat-${attrKey}`}
                      value={score}
                      onChange={(e) => handleStatChange(attrKey, Number(e.target.value))}
                      className="bg-zinc-800 text-amber-300 font-mono font-bold text-sm px-3 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {STANDARD_ARRAY.map((val) => (
                        <option key={val} value={val}>
                          {val} (Mod {getModifier(val) >= 0 ? `+${getModifier(val)}` : getModifier(val)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-cinzel text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button
              onClick={() => {
                sounds.playDiceRoll();
                setStep(3);
              }}
              className="py-3 px-8 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-cinzel font-bold text-base flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Continuar a Equipo</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EQUIPMENT SET & INITIAL SKILL */}
      {step === 3 && (
        <div className="py-6 flex-1 flex flex-col gap-8">
          {/* Equipment Set Selection */}
          <div>
            <h3 className="text-lg font-cinzel font-bold text-zinc-100 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span>Selecciona un Conjunto de Equipo (4 disponibles)</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Muestra el arma equipada, tipo de armadura y la Clase de Armadura (CA) resultante calculada según tus atributos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classDef.equipmentSets.map((set, idx) => {
                const isSelected = selectedSetIndex === idx;
                const setAC = calculateAC(
                  set.armor.armorType || 'none',
                  dexMod,
                  !!set.shield
                );

                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => {
                      sounds.playDiceRoll();
                      setSelectedSetIndex(idx);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-cinzel font-bold text-zinc-100">{set.name}</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
                          CA {setAC}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-3">{set.description}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-300 pt-3 border-t border-zinc-800">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Arma:</span>
                        <span className="font-medium text-amber-200">
                          {set.weapon.name} ({set.weapon.baseDamageDice?.count}d{set.weapon.baseDamageDice?.sides})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Armadura:</span>
                        <span className="font-medium">{set.armor.name}</span>
                      </div>
                      {set.shield && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Escudo:</span>
                          <span>{set.shield.name} (+2 CA)</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Special Skill / Spell Choice */}
          <div>
            <h3 className="text-lg font-cinzel font-bold text-zinc-100 mb-2 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-500" />
              <span>Habilidad Especial Inicial (Coste: 1 Energía/Magia)</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Además de tu habilidad básica ilimitada ({classDef.basicAbility.name}), elige con qué técnica mística o marcial comenzarás.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classDef.initialSkillChoices.map((skill) => {
                const isSelected = selectedSkillId === skill.id;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => {
                      sounds.playSpellCast();
                      setSelectedSkillId(skill.id);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel font-bold text-zinc-100">{skill.name}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[11px] font-mono border border-blue-800">
                        Coste 1
                      </span>
                    </div>
                    <p className="text-xs text-amber-400/90 font-medium mb-1">
                      {skill.damageDice ? `Daño: ${skill.damageDice.count}d${skill.damageDice.sides}` : 'Efecto especial'}
                    </p>
                    <p className="text-xs text-zinc-400">{skill.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="py-3 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-cinzel text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button
              onClick={() => {
                sounds.playDiceRoll();
                setStep(4);
              }}
              className="py-3 px-8 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-cinzel font-bold text-base flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Ver Ficha Final</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL CHARACTER SHEET & COMMENCE */}
      {step === 4 && (
        <div className="py-6 flex-1 flex flex-col">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="text-9xl">{classDef.icon}</span>
            </div>

            {/* Character Header and Name input */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800">
              <div className="flex-1 w-full sm:max-w-md">
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-cinzel mb-1">
                  Nombre del Aventurero
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    maxLength={32}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-cinzel text-lg font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const names = DEFAULT_NAMES[selectedClass];
                      setCharacterName(names[Math.floor(Math.random() * names.length)]);
                    }}
                    title="Generar nombre aleatorio"
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                  >
                    <Dices className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-center px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="block text-xl font-bold font-mono text-emerald-400">{maxHp}</span>
                  <span className="text-[10px] text-zinc-500 uppercase">HP Máx</span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="block text-xl font-bold font-mono text-cyan-400">{maxEnergy}</span>
                  <span className="text-[10px] text-zinc-500 uppercase">Energía</span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="block text-xl font-bold font-mono text-amber-400">{resultingAC}</span>
                  <span className="text-[10px] text-zinc-500 uppercase">CA</span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="block text-xl font-bold font-mono text-zinc-300">+{prof}</span>
                  <span className="text-[10px] text-zinc-500 uppercase">Comp.</span>
                </div>
              </div>
            </div>

            {/* Attributes Matrix */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-6">
              {(Object.keys(stats) as AttributeKey[]).map((attr) => {
                const val = stats[attr];
                const mod = getModifier(val);
                return (
                  <div key={attr} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                    <span className="block text-xs font-semibold text-zinc-400">{attr}</span>
                    <span className="block text-lg font-bold font-mono text-zinc-100">{val}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {mod >= 0 ? `+${mod}` : mod}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Gear and Skills breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="font-cinzel font-bold text-amber-400 block mb-2">Equipo Equipado</span>
                <p className="text-zinc-300 mb-1">
                  <strong className="text-zinc-400">Arma:</strong> {currentSet.weapon.name} ({currentSet.weapon.baseDamageDice?.count}d{currentSet.weapon.baseDamageDice?.sides})
                </p>
                <p className="text-zinc-300 mb-1">
                  <strong className="text-zinc-400">Armadura:</strong> {currentSet.armor.name}
                </p>
                {currentSet.shield && (
                  <p className="text-zinc-300">
                    <strong className="text-zinc-400">Escudo:</strong> {currentSet.shield.name} (+2 CA)
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="font-cinzel font-bold text-amber-400 block mb-2">Habilidades Iniciales</span>
                <p className="text-zinc-300 mb-1">
                  <strong className="text-zinc-400">Básica:</strong> {classDef.basicAbility.name} (Coste 0)
                </p>
                <p className="text-zinc-300">
                  <strong className="text-zinc-400">Especial:</strong> {chosenSkill.name} (Coste 1)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="py-3 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-cinzel text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button
              onClick={handleFinalize}
              data-start="true"
              className="py-4 px-10 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-cinzel font-bold text-lg flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-98 transition-all"
            >
              <Check className="w-6 h-6" />
              <span>Comenzar Aventura</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
