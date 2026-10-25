/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getNextCampDistance } from '../game/rules';
import { ConsumableItem, EquipmentItem, PlayerCharacter } from '../game/types';
import { sounds } from '../utils/audio';
import {
  ArrowRight,
  CheckCircle,
  Coins,
  Flame,
  Heart,
  Save,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';

interface CampViewProps {
  player: PlayerCharacter;
  campIndex: number;
  onUpdatePlayer: (updated: PlayerCharacter) => void;
  onContinue: () => void;
  onSaveToStorage: () => void;
}

export const CampView: React.FC<CampViewProps> = ({
  player,
  campIndex,
  onUpdatePlayer,
  onContinue,
  onSaveToStorage,
}) => {
  const [rested, setRested] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hub' | 'shop'>('hub');
  const [shopFeedback, setShopFeedback] = useState<string | null>(null);

  const nextDistance = getNextCampDistance(campIndex + 1);

  // 1. Descansar
  const handleRest = () => {
    sounds.playHeal();
    onUpdatePlayer({
      ...player,
      currentHp: player.maxHp,
      currentEnergy: player.maxEnergy,
      statusEffects: [],
    });
    setRested(true);
  };

  // 2. Guardar Progreso
  const handleSaveProgress = () => {
    sounds.playCoin();
    // Convert expedition gold to safe gold
    const totalSafe = player.safeGold + player.expeditionGold;
    const updated = {
      ...player,
      safeGold: totalSafe,
      expeditionGold: 0,
    };
    onUpdatePlayer(updated);
    onSaveToStorage();
    setSaved(true);
  };

  // 3. Tienda: Comprar consumibles
  const buyItem = (itemTemplate: ConsumableItem) => {
    if (player.safeGold < itemTemplate.value) {
      setShopFeedback('No dispones de suficiente Oro Seguro en tus arcas.');
      return;
    }
    sounds.playCoin();
    const updated = {
      ...player,
      safeGold: player.safeGold - itemTemplate.value,
      inventory: [...player.inventory, { ...itemTemplate, id: `item_${Date.now()}` }],
    };
    onUpdatePlayer(updated);
    setShopFeedback(`¡Has comprado ${itemTemplate.name}!`);
  };

  // Mejorar arma
  const upgradeWeaponCost = (player.equippedWeapon.upgradeLevel + 1) * 60;
  const canUpgradeWeapon = player.equippedWeapon.upgradeLevel < 3 && player.safeGold >= upgradeWeaponCost;

  const handleUpgradeWeapon = () => {
    if (!canUpgradeWeapon) return;
    sounds.playFanfare();
    const nextLevel = player.equippedWeapon.upgradeLevel + 1;
    const updatedWeapon: EquipmentItem = {
      ...player.equippedWeapon,
      upgradeLevel: nextLevel,
      name: `${player.equippedWeapon.name.replace(/ \+\d$/, '')} +${nextLevel}`,
    };
    const updated = {
      ...player,
      safeGold: player.safeGold - upgradeWeaponCost,
      equippedWeapon: updatedWeapon,
    };
    onUpdatePlayer(updated);
    setShopFeedback(`¡Tu arma ha sido templada a +${nextLevel}! (+${nextLevel} a tiradas de ataque y daño).`);
  };

  // Mejorar armadura
  const upgradeArmorCost = (player.equippedArmor.upgradeLevel + 1) * 75;
  const canUpgradeArmor = player.equippedArmor.upgradeLevel < 3 && player.safeGold >= upgradeArmorCost;

  const handleUpgradeArmor = () => {
    if (!canUpgradeArmor) return;
    sounds.playFanfare();
    const nextLevel = player.equippedArmor.upgradeLevel + 1;
    const updatedArmor: EquipmentItem = {
      ...player.equippedArmor,
      upgradeLevel: nextLevel,
      bonusAC: (player.equippedArmor.bonusAC || 0) + 1,
      name: `${player.equippedArmor.name.replace(/ \+\d$/, '')} +${nextLevel}`,
    };
    const updated = {
      ...player,
      safeGold: player.safeGold - upgradeArmorCost,
      equippedArmor: updatedArmor,
    };
    onUpdatePlayer(updated);
    setShopFeedback(`¡Tu armadura ha sido reforzada a +${nextLevel}! (+${nextLevel} a la Clase de Armadura).`);
  };

  // Vender objeto
  const handleSellItem = (index: number) => {
    const item = player.inventory[index];
    sounds.playCoin();
    const sellPrice = Math.max(10, Math.floor(item.value * 0.75));
    const newInventory = [...player.inventory];
    newInventory.splice(index, 1);

    const updated = {
      ...player,
      safeGold: player.safeGold + sellPrice,
      inventory: newInventory,
    };
    onUpdatePlayer(updated);
    setShopFeedback(`Has vendido ${item.name} por ${sellPrice} de Oro Seguro.`);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full select-none" data-testid="camp-screen">
      {/* Campfire Visual Stage */}
      <div className="relative w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center shadow-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-radial from-amber-950/30 via-zinc-950/80 to-zinc-950 pointer-events-none" />

        {/* Campfire Graphic */}
        <div className="relative flex flex-col items-center z-10">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 blur-xl absolute -top-4 animate-pulse" />
          <Flame className="w-16 h-16 sm:w-20 sm:h-20 text-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.9)] animate-bounce" />
          <div className="w-24 h-4 bg-zinc-800 rounded-full blur-sm mt-1" />
        </div>

        <h2 className="mt-4 text-2xl sm:text-3xl font-title font-bold text-amber-100 text-glow-amber z-10 text-center">
          Refugio del Campamento
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 z-10 text-center font-medieval max-w-md">
          Un santuario seguro entre las frías galerías subterráneas. Alimenta la hoguera, asegura tu oro y comercia con los mercaderes.
        </p>

        {/* Currency status in camp */}
        <div className="mt-4 flex gap-4 z-10 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Oro Seguro: <strong className="text-amber-300 font-mono text-sm">{player.safeGold}</strong></span>
          </div>

          {player.expeditionGold > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-600/50 flex items-center gap-2">
              <span>Oro de Expedición a Asegurar: <strong className="text-amber-400 font-mono text-sm">+{player.expeditionGold}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Mode navigation: Hub vs Shop */}
      <div className="flex gap-2 mb-4 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('hub')}
          className={`py-2 px-4 rounded-lg font-cinzel text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'hub'
              ? 'bg-amber-600 text-zinc-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Campamento Principal
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`py-2 px-4 rounded-lg font-cinzel text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'shop'
              ? 'bg-amber-600 text-zinc-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Tienda y Forja</span>
        </button>
      </div>

      {/* TAB 1: CAMP HUB */}
      {activeTab === 'hub' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Descansar */}
            <button
              onClick={handleRest}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                rested
                  ? 'bg-emerald-950/20 border-emerald-600/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 hover:border-amber-500/60 shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-cinzel font-bold text-base text-zinc-100 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <span>Descansar junto al Fuego</span>
                  </span>
                  {rested && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Descansado
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Recupera todos tus Puntos de Golpe ({player.maxHp} HP) y restaura tu Energía/Magia al máximo ({player.maxEnergy}).
                </p>
              </div>
            </button>

            {/* Guardar Progreso */}
            <button
              onClick={handleSaveProgress}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                saved
                  ? 'bg-amber-950/30 border-amber-500'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 hover:border-amber-500/60 shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-cinzel font-bold text-base text-zinc-100 flex items-center gap-2">
                    <Save className="w-5 h-5 text-amber-500" />
                    <span>Guardar Progreso</span>
                  </span>
                  {saved && (
                    <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Asegurado
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Transfiere todo el Oro de Expedición (+{player.expeditionGold}) a Oro Seguro en tu banco y guarda la partida en tu navegador.
                </p>
              </div>
            </button>
          </div>

          {/* Siguiente Expedición Info */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="font-cinzel font-bold text-zinc-200 block mb-0.5">
                Próxima Etapa de Exploración
              </span>
              <span>
                Para alcanzar el siguiente campamento deberás atravesar <strong className="text-amber-300 font-mono">{nextDistance} salas</strong> (la última será un Jefe temible).
              </span>
            </div>

            <button
              onClick={() => {
                // Auto-save progress if not already saved
                if (player.expeditionGold > 0) {
                  handleSaveProgress();
                }
                sounds.playDiceRoll();
                onContinue();
              }}
              data-start="true"
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-cinzel font-bold text-base shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span>Continuar Expedición</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SHOP AND FORGE */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          {shopFeedback && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs font-medium">
              {shopFeedback}
            </div>
          )}

          {/* Upgrade Equipment Section */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <span className="text-xs uppercase tracking-wider font-cinzel font-bold text-amber-400 block">
              Forja del Herrero: Mejoras de Equipo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Weapon Upgrade */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-xs text-zinc-200 block">
                    {player.equippedWeapon.name}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Nivel actual: +{player.equippedWeapon.upgradeLevel} (máx +3)
                  </span>
                </div>

                {player.equippedWeapon.upgradeLevel < 3 ? (
                  <button
                    onClick={handleUpgradeWeapon}
                    disabled={!canUpgradeWeapon}
                    className="py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-cinzel font-bold text-xs cursor-pointer"
                  >
                    Mejorar ({upgradeWeaponCost} 🪙)
                  </button>
                ) : (
                  <span className="text-xs font-mono text-amber-400 font-bold">Máximo</span>
                )}
              </div>

              {/* Armor Upgrade */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-xs text-zinc-200 block">
                    {player.equippedArmor.name}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Nivel actual: +{player.equippedArmor.upgradeLevel} (máx +3)
                  </span>
                </div>

                {player.equippedArmor.upgradeLevel < 3 ? (
                  <button
                    onClick={handleUpgradeArmor}
                    disabled={!canUpgradeArmor}
                    className="py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-cinzel font-bold text-xs cursor-pointer"
                  >
                    Mejorar ({upgradeArmorCost} 🪙)
                  </button>
                ) : (
                  <span className="text-xs font-mono text-amber-400 font-bold">Máximo</span>
                )}
              </div>
            </div>
          </div>

          {/* Consumables Catalog */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <span className="text-xs uppercase tracking-wider font-cinzel font-bold text-amber-400 block">
              Pertrechos y Pociones del Mercader
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() =>
                  buyItem({
                    id: 'pot_shop_1',
                    name: 'Poción de Curación Menor',
                    type: 'potion_heal',
                    healAmount: 15,
                    value: 25,
                    description: 'Restaura 15 HP al instante.',
                  })
                }
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 text-left transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-200">Poción Menor</span>
                  <span className="text-xs font-mono text-amber-400">25 🪙</span>
                </div>
                <p className="text-[10px] text-zinc-400">Restaura 15 HP</p>
              </button>

              <button
                onClick={() =>
                  buyItem({
                    id: 'pot_shop_2',
                    name: 'Poción de Curación Mayor',
                    type: 'potion_heal',
                    healAmount: 30,
                    value: 60,
                    description: 'Restaura 30 HP al instante.',
                  })
                }
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 text-left transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-200">Poción Mayor</span>
                  <span className="text-xs font-mono text-amber-400">60 🪙</span>
                </div>
                <p className="text-[10px] text-zinc-400">Restaura 30 HP</p>
              </button>

              <button
                onClick={() =>
                  buyItem({
                    id: 'pot_shop_3',
                    name: 'Elixir de Maná',
                    type: 'potion_energy',
                    energyAmount: 2,
                    value: 50,
                    description: 'Restaura 2 puntos de Energía/Magia.',
                  })
                }
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 text-left transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-200">Elixir de Maná</span>
                  <span className="text-xs font-mono text-amber-400">50 🪙</span>
                </div>
                <p className="text-[10px] text-zinc-400">Restaura 2 Energía</p>
              </button>
            </div>
          </div>

          {/* Sell Loot Inventory */}
          {player.inventory.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <span className="text-xs uppercase tracking-wider font-cinzel font-bold text-zinc-400 block">
                Vender Objetos de tu Mochila (a cambio de Oro Seguro)
              </span>

              <div className="space-y-2">
                {player.inventory.map((item, idx) => {
                  const sellValue = Math.max(10, Math.floor(item.value * 0.75));
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-semibold text-zinc-200">{item.name}</span>
                        <p className="text-[10px] text-zinc-500">{item.description}</p>
                      </div>

                      <button
                        onClick={() => handleSellItem(idx)}
                        className="py-1 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono cursor-pointer"
                      >
                        Vender (+{sellValue} 🪙)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
