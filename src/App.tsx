/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CampView } from './components/CampView';
import { CharacterCreation } from './components/CharacterCreation';
import { CombatView } from './components/CombatView';
import { DeathView } from './components/DeathView';
import { DungeonHeader } from './components/DungeonHeader';
import { InventoryModal } from './components/InventoryModal';
import { LevelUpModal } from './components/LevelUpModal';
import { RoomView } from './components/RoomView';
import { TitleScreen } from './components/TitleScreen';
import { CLASSES_DATA } from './game/data';
import { generateNextRoom } from './game/dungeon';
import {
  calculateMaxEnergy,
  calculateMaxHP,
  getModifier,
  getNextCampDistance,
  getXpForNextLevel,
} from './game/rules';
import {
  ConsumableItem,
  GameScreen,
  PlayerCharacter,
  Room,
} from './game/types';
import { sounds } from './utils/audio';

const STORAGE_KEY = 'mazmorra_infinita_save_v1';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('title');
  const [player, setPlayer] = useState<PlayerCharacter | null>(null);
  const [campIndex, setCampIndex] = useState<number>(0);
  const [currentRoomIndex, setCurrentRoomIndex] = useState<number>(1);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  const [savedData, setSavedData] = useState<{
    player: PlayerCharacter;
    campIndex: number;
    currentRoomIndex: number;
  } | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [lostGoldOnDeath, setLostGoldOnDeath] = useState<number>(0);

  // Level up tracking
  const [levelUpData, setLevelUpData] = useState<{
    newLevel: number;
    hpGained: number;
    energyGained: number;
  } | null>(null);

  // Load saved game from localStorage on boot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.player) {
          setSavedData(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Handle ?autostart=1 query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const gDef = CLASSES_DATA['Guerrero'];
      const defaultHero: PlayerCharacter = {
        name: 'Valerius el Férreo',
        classType: 'Guerrero',
        level: 1,
        xp: 0,
        maxHp: 12,
        currentHp: 12,
        maxEnergy: 2,
        currentEnergy: 2,
        attributes: { STR: 15, CON: 14, DEX: 13, WIS: 12, CHA: 10, INT: 8 },
        equippedWeapon: { ...gDef.equipmentSets[0].weapon },
        equippedArmor: { ...gDef.equipmentSets[0].armor },
        equippedShield: gDef.equipmentSets[0].shield ? { ...gDef.equipmentSets[0].shield } : undefined,
        abilities: [gDef.basicAbility, gDef.initialSkillChoices[0]],
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
        safeGold: 50,
        expeditionGold: 0,
      };
      setPlayer(defaultHero);
      setCampIndex(0);
      setCurrentRoomIndex(1);
      const room1 = generateNextRoom(1, 0, defaultHero);
      setCurrentRoom(room1);
      setScreen('room');
      document.body.dataset.state = 'playing';
    }
  }, []);

  // Update document.body.dataset.state for testability
  useEffect(() => {
    if (screen === 'title') {
      document.body.dataset.state = 'title';
    } else if (screen === 'gameover') {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [screen]);

  // Global key bindings ([M] for mute, [I] for inventory)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'm') {
        const nextMute = sounds.toggleMute();
        setIsMuted(nextMute);
      }
      if (e.key.toLowerCase() === 'i' && player && screen !== 'title' && screen !== 'character_creation') {
        setShowInventory((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [player, screen]);

  const handleToggleMute = () => {
    const nextMute = sounds.toggleMute();
    setIsMuted(nextMute);
  };

  // Start new game
  const handleStartNewGame = () => {
    setScreen('character_creation');
  };

  // Resume saved game
  const handleResumeGame = () => {
    if (!savedData) return;
    setPlayer(savedData.player);
    setCampIndex(savedData.campIndex);
    setCurrentRoomIndex(savedData.currentRoomIndex);
    const room = generateNextRoom(savedData.currentRoomIndex, savedData.campIndex, savedData.player);
    setCurrentRoom(room);
    setScreen('room');
  };

  // Character creation completed
  const handleCharacterCreated = (newHero: PlayerCharacter) => {
    setPlayer(newHero);
    setCampIndex(0);
    setCurrentRoomIndex(1);
    const firstRoom = generateNextRoom(1, 0, newHero);
    setCurrentRoom(firstRoom);
    setScreen('room');
  };

  // Save state to local storage
  const handleSaveToLocalStorage = () => {
    if (!player) return;
    const dataToSave = {
      player: { ...player },
      campIndex,
      currentRoomIndex,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setSavedData(dataToSave);
    } catch {
      // Ignore quota errors
    }
  };

  // Check and process level up
  const processXpAndLevelUp = (currentPlayer: PlayerCharacter, xpToAdd: number): PlayerCharacter => {
    let nextXp = currentPlayer.xp + xpToAdd;
    let nextLevel = currentPlayer.level;
    let hpGain = 0;
    let energyGain = 0;

    let threshold = getXpForNextLevel(nextLevel);
    while (nextXp >= threshold) {
      nextXp -= threshold;
      nextLevel += 1;

      // Calculate HP gain
      const conMod = getModifier(currentPlayer.attributes.CON);
      const prevMaxHp = calculateMaxHP(currentPlayer.classType, conMod, nextLevel - 1);
      const newMaxHp = calculateMaxHP(currentPlayer.classType, conMod, nextLevel);
      hpGain += (newMaxHp - prevMaxHp);

      // Energy increase
      const prevEnergy = calculateMaxEnergy(nextLevel - 1);
      const newEnergy = calculateMaxEnergy(nextLevel);
      if (newEnergy > prevEnergy) {
        energyGain += (newEnergy - prevEnergy);
      }

      threshold = getXpForNextLevel(nextLevel);
    }

    if (nextLevel > currentPlayer.level) {
      sounds.playFanfare();
      setLevelUpData({
        newLevel: nextLevel,
        hpGained: hpGain,
        energyGained: energyGain,
      });

      return {
        ...currentPlayer,
        level: nextLevel,
        xp: nextXp,
        maxHp: currentPlayer.maxHp + hpGain,
        currentHp: currentPlayer.currentHp + hpGain,
        maxEnergy: currentPlayer.maxEnergy + energyGain,
        currentEnergy: currentPlayer.currentEnergy + energyGain,
      };
    }

    return {
      ...currentPlayer,
      xp: nextXp,
    };
  };

  // Advance to next room
  const handleAdvanceToNextRoom = () => {
    if (!player) return;
    sounds.playDiceRoll();

    const nextIndex = currentRoomIndex + 1;
    setCurrentRoomIndex(nextIndex);
    const nextRoom = generateNextRoom(nextIndex, campIndex, player);
    setCurrentRoom(nextRoom);
    setScreen('room');
  };

  // Room resolved (e.g. trap, event or safe room)
  const handleRoomResolved = (updates: {
    hpDelta?: number;
    expeditionGoldDelta?: number;
    xpDelta?: number;
    acquiredItem?: ConsumableItem;
    equipmentUpgrade?: boolean;
  }) => {
    if (!player) return;

    let updated = { ...player };

    if (updates.hpDelta) {
      const nextHp = Math.max(0, Math.min(player.maxHp, player.currentHp + updates.hpDelta));
      updated.currentHp = nextHp;
      if (nextHp <= 0) {
        sounds.playDefeat();
        setLostGoldOnDeath(player.expeditionGold);
        setScreen('gameover');
        return;
      }
    }

    if (updates.expeditionGoldDelta) {
      updated.expeditionGold = Math.max(0, player.expeditionGold + updates.expeditionGoldDelta);
    }

    if (updates.acquiredItem) {
      updated.inventory = [...player.inventory, updates.acquiredItem];
    }

    if (updates.xpDelta) {
      updated = processXpAndLevelUp(updated, updates.xpDelta);
    }

    setPlayer(updated);
  };

  // Combat victory
  const handleCombatVictory = (
    updatedPlayer: PlayerCharacter,
    xpGained: number,
    goldGained: number,
    itemDropped?: ConsumableItem
  ) => {
    let p = {
      ...updatedPlayer,
      expeditionGold: updatedPlayer.expeditionGold + goldGained,
    };
    if (itemDropped) {
      p.inventory = [...p.inventory, itemDropped];
    }

    p = processXpAndLevelUp(p, xpGained);
    setPlayer(p);

    // If current room was boss room -> Campfire reached!
    if (currentRoom?.isBossRoom) {
      sounds.playFanfare();
      // Auto-save on reaching camp
      const dataToSave = {
        player: { ...p, safeGold: p.safeGold + p.expeditionGold, expeditionGold: 0 },
        campIndex: campIndex + 1,
        currentRoomIndex: currentRoomIndex + 1,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setSavedData(dataToSave);
      } catch {}
      setScreen('camp');
    } else {
      // Normal room cleared -> Advance to next room
      handleAdvanceToNextRoom();
    }
  };

  // Combat defeat
  const handleCombatDefeat = () => {
    if (!player) return;
    setLostGoldOnDeath(player.expeditionGold);
    setScreen('gameover');
  };

  // Revive at camp
  const handleReviveAtCamp = () => {
    if (!player) return;
    // Lost: expedition gold & unbanked items from current run
    // Preserved: Level, XP, abilities, safe gold, equipped gear
    const revived: PlayerCharacter = {
      ...player,
      currentHp: player.maxHp,
      currentEnergy: player.maxEnergy,
      statusEffects: [],
      expeditionGold: 0,
    };
    setPlayer(revived);

    // Sequence advances when reaching camp OR when reviving as specified
    const nextCamp = campIndex + 1;
    setCampIndex(nextCamp);
    setCurrentRoomIndex(currentRoomIndex + 1);

    // Save state
    const dataToSave = {
      player: revived,
      campIndex: nextCamp,
      currentRoomIndex: currentRoomIndex + 1,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setSavedData(dataToSave);
    } catch {}

    setScreen('camp');
  };

  // Continue from camp
  const handleContinueFromCamp = () => {
    if (!player) return;
    const nextCamp = campIndex + 1;
    setCampIndex(nextCamp);
    const nextIndex = currentRoomIndex + 1;
    setCurrentRoomIndex(nextIndex);
    const nextRoom = generateNextRoom(nextIndex, nextCamp, player);
    setCurrentRoom(nextRoom);
    setScreen('room');
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Active Dungeon Header (when playing in room, combat or camp) */}
      {player && currentRoom && (screen === 'room' || screen === 'combat' || screen === 'camp') && (
        <DungeonHeader
          player={player}
          room={currentRoom}
          onOpenInventory={() => setShowInventory(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Screen Router */}
      <main className="flex-1 flex flex-col">
        {screen === 'title' && (
          <TitleScreen
            onStartNewGame={handleStartNewGame}
            onResumeGame={savedData ? handleResumeGame : undefined}
            savedPlayer={savedData?.player}
            savedCampIndex={savedData?.campIndex}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {screen === 'character_creation' && (
          <CharacterCreation
            onComplete={handleCharacterCreated}
            onCancel={() => setScreen('title')}
          />
        )}

        {screen === 'room' && currentRoom && player && (
          <RoomView
            room={currentRoom}
            player={player}
            onEnterCombat={() => setScreen('combat')}
            onRoomResolved={handleRoomResolved}
            onNextRoom={handleAdvanceToNextRoom}
          />
        )}

        {screen === 'combat' && currentRoom?.enemy && player && (
          <CombatView
            player={player}
            enemy={currentRoom.enemy}
            onVictory={handleCombatVictory}
            onDefeat={handleCombatDefeat}
            onFlee={handleAdvanceToNextRoom}
          />
        )}

        {screen === 'camp' && player && (
          <CampView
            player={player}
            campIndex={campIndex}
            onUpdatePlayer={setPlayer}
            onContinue={handleContinueFromCamp}
            onSaveToStorage={handleSaveToLocalStorage}
          />
        )}

        {screen === 'gameover' && player && (
          <DeathView
            player={player}
            lostExpeditionGold={lostGoldOnDeath}
            onRevive={handleReviveAtCamp}
          />
        )}
      </main>

      {/* Level Up Announcement Modal */}
      {levelUpData && player && (
        <LevelUpModal
          player={player}
          newLevel={levelUpData.newLevel}
          hpGained={levelUpData.hpGained}
          energyGained={levelUpData.energyGained}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* Global Inventory / Character Sheet Modal */}
      {showInventory && player && (
        <InventoryModal
          player={player}
          onClose={() => setShowInventory(false)}
          onUpdatePlayer={setPlayer}
        />
      )}
    </div>
  );
}
