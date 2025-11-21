
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_TOKENS, SCOUT_COST, ENHANCE_ART_COST, TYPE_CHART, BATTLE_REWARD_BASE, STAGES_PER_ZONE, ZONES, STARTER_PACK_SIZE, SKILL_DATABASE, MASTER_CARDS, STARTER_DEX_IDS } from './constants';
import { CardData, Inventory, Rarity, BattleState, AdventureProgress, Skill, BattleCard, Buff, HitMeta, GameState, BattleStatus } from './types';
import { generateCardArt } from './services/geminiService';
import { CardView } from './components/CardView';
import { InventoryGrid } from './components/InventoryGrid';
import { BattleArena } from './components/BattleArena';
import { AdventureView } from './components/AdventureView';
import { PokedexView } from './components/PokedexView';
import { Layers, Compass, X, Wallet, Maximize2, Minimize2, Joystick, Search, Bug, BookOpen, Gift, Save, Upload, Download, Trash2, Play, LogOut } from 'lucide-react';

// ---- Main Component ----

export default function App() {
  // --- State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [view, setView] = useState<'inventory' | 'gacha' | 'battle' | 'adventure' | 'pokedex'>('gacha');
  
  // Core Data
  const [knownCards, setKnownCards] = useState<Record<string, CardData>>({});
  const [inventory, setInventory] = useState<Inventory>({});
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [awakening, setAwakening] = useState<Record<string, number>>({});
  const [adventure, setAdventure] = useState<AdventureProgress>({
    currentZoneIndex: 0,
    currentStage: 1,
    unlockedZones: 0
  });
  const [hasClaimedStarter, setHasClaimedStarter] = useState(false);
  
  // UI State
  const [showStarterModal, setShowStarterModal] = useState(false);
  const [drawnCards, setDrawnCards] = useState<{cardId: string, rarity: Rarity, isNew: boolean}[]>([]);
  const [lastDrawAmount, setLastDrawAmount] = useState<number>(0); 
  const [isScouting, setIsScouting] = useState(false);
  const [isEnhancingId, setIsEnhancingId] = useState<string | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]); 
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  // --- Initialization & Persistence ---

  const encodeSaveData = (data: GameState): string => {
      try {
          const json = JSON.stringify(data);
          return btoa(unescape(encodeURIComponent(json)));
      } catch (e) {
          console.error("Encryption failed", e);
          return "";
      }
  };

  const decodeSaveData = (encoded: string): GameState => {
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
  };

  useEffect(() => {
    const savedData = localStorage.getItem('pokegen_save_v1');
    if (savedData) {
      try {
        const state = JSON.parse(savedData);
        setKnownCards(state.knownCards);
        setInventory(state.inventory);
        setTokens(state.tokens);
        setAdventure(state.adventure);
        setHasClaimedStarter(state.hasClaimedStarter);
        setAwakening(state.awakening || {});
        setGameStarted(true);
      } catch (e) {
        console.error("Failed to load save:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    if (Object.keys(knownCards).length === 0) return;

    const timer = setTimeout(() => {
       saveGame();
    }, 1000);
    return () => clearTimeout(timer);
  }, [knownCards, inventory, tokens, adventure, hasClaimedStarter, awakening, gameStarted]);

  const handleStartNewGame = () => {
      const starters: Record<string, CardData> = {};
      MASTER_CARDS.filter(c => STARTER_DEX_IDS.includes(c.id)).forEach(c => starters[c.id] = c);
      setKnownCards(starters);
      setInventory({});
      setTokens(INITIAL_TOKENS);
      setAdventure({ currentZoneIndex: 0, currentStage: 1, unlockedZones: 0 });
      setHasClaimedStarter(false);
      setAwakening({});
      
      setGameStarted(true);
      setShowStarterModal(true);
  };

  const saveGame = () => {
     const state: GameState = { knownCards, inventory, tokens, adventure, hasClaimedStarter, awakening };
     localStorage.setItem('pokegen_save_v1', JSON.stringify(state));
  };

  const handleExportSave = () => {
      const state: GameState = { knownCards, inventory, tokens, adventure, hasClaimedStarter, awakening };
      const encryptedData = encodeSaveData(state);
      const blob = new Blob([encryptedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pokegen_save_${new Date().toISOString().slice(0,10)}.save`; 
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportSave = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const fileContent = e.target?.result as string;
              let state: GameState;
              try {
                  state = decodeSaveData(fileContent);
              } catch (err) {
                  state = JSON.parse(fileContent);
              }
              if (!state.knownCards || !state.inventory) throw new Error("Invalid Save Data Structure");

              localStorage.setItem('pokegen_save_v1', JSON.stringify(state));
              setKnownCards(state.knownCards);
              setInventory(state.inventory);
              setTokens(state.tokens);
              setAdventure(state.adventure);
              setHasClaimedStarter(state.hasClaimedStarter);
              setAwakening(state.awakening || {});
              setGameStarted(true);
              alert("存档读取成功!");
          } catch (err) {
              alert("存档读取失败: 文件已损坏或格式错误");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };
  
  const handleLogout = () => {
      if (window.confirm("确定要退出登录并清除本地存档吗？")) {
          localStorage.removeItem('pokegen_save_v1');
          setGameStarted(false);
          setKnownCards({});
          setInventory({});
          setTokens(INITIAL_TOKENS);
          setAwakening({});
      }
  };

  // --- Helpers ---

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const addToInventory = (cardId: string, rarity: Rarity, count: number = 1) => {
    const key = `${cardId}_${rarity}`;
    setInventory(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + count
    }));
  };

  const handleMerge = (cardId: string, currentRarity: Rarity) => {
    const key = `${cardId}_${currentRarity}`;
    const count = inventory[key] || 0;
    if (count >= 3 && currentRarity < Rarity.LEGENDARY) {
      setInventory(prev => {
        const nextRarity = currentRarity + 1;
        const nextKey = `${cardId}_${nextRarity}`;
        return { ...prev, [key]: prev[key] - 3, [nextKey]: (prev[nextKey] || 0) + 1 };
      });
    }
  };

  const handleAwaken = (cardId: string) => {
     const key = `${cardId}_${Rarity.LEGENDARY}`;
     const count = inventory[key] || 0;
     const currentLevel = awakening[cardId] || 0;

     if (count > 1 && currentLevel < 5) {
         setInventory(prev => ({ ...prev, [key]: prev[key] - 1 }));
         setAwakening(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + 1 }));
         alert(`界限突破成功! ${knownCards[cardId].name} 等级提升至 +${currentLevel + 1}!`);
     }
  };

  // --- Team Selection Helper ---
  const handleSelectCard = (key: string) => {
      setSelectedTeamIds(prev => {
          if (prev.includes(key)) {
              return prev.filter(k => k !== key);
          } else {
              if (prev.length >= 6) {
                  alert("队伍已满 (最多6只)!");
                  return prev;
              }
              return [...prev, key];
          }
      });
  };

  const claimStarterPack = () => {
      setHasClaimedStarter(true);
      setShowStarterModal(false);
      setLastDrawAmount(STARTER_PACK_SIZE);
      drawCards(STARTER_PACK_SIZE);
  };

  const drawCards = (amount: number) => {
    const allIds = Object.keys(knownCards);
    if (allIds.length === 0) return;
    const results: {cardId: string, rarity: Rarity, isNew: boolean}[] = [];
    for (let i = 0; i < amount; i++) {
      const randomId = allIds[Math.floor(Math.random() * allIds.length)];
      const r = Math.random();
      let rarity = Rarity.COMMON;
      if (r > 0.999) rarity = Rarity.LEGENDARY;
      else if (r > 0.99) rarity = Rarity.EPIC;
      else if (r > 0.95) rarity = Rarity.RARE;
      else if (r > 0.70) rarity = Rarity.UNCOMMON;
      const hasAnyCopy = Object.keys(inventory).some(k => k.startsWith(randomId));
      addToInventory(randomId, rarity);
      results.push({ cardId: randomId, rarity, isNew: !hasAnyCopy });
    }
    setDrawnCards(results);
    setShowDrawModal(true);
    if (hasClaimedStarter) setTokens(prev => prev + (amount * 2));
  };

  const handleBuyDraw = (amount: number) => {
      const drawCost = amount * 100;
      if (tokens < drawCost) {
          alert("金币不足！需要去冒险赚取金币。");
          return;
      }
      setTokens(prev => prev - drawCost);
      setLastDrawAmount(amount); 
      drawCards(amount);
  };

  const handleScout = async () => {
    if (tokens < SCOUT_COST) {
      alert("金币不足!");
      return;
    }
    setIsScouting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const knownIds = Object.keys(knownCards);
    const availablePool = MASTER_CARDS.filter(c => !knownIds.includes(c.id));
    if (availablePool.length === 0) {
        alert("你已经发现了所有物种！");
        setIsScouting(false);
        return;
    }
    const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
    const newDiscoveries = shuffled.slice(0, Math.min(3, shuffled.length));
    setTokens(prev => prev - SCOUT_COST);
    setKnownCards(prev => {
        const next = { ...prev };
        newDiscoveries.forEach(c => next[c.id] = c);
        return next;
    });
    alert(`发现新物种!\n${newDiscoveries.map(c => `• ${c.name}`).join('\n')}`);
    setIsScouting(false);
  };

  const handleEnhanceArt = async (cardId: string) => {
    const card = knownCards[cardId];
    if (card.imageUrl) return; 
    if (tokens < ENHANCE_ART_COST) {
      alert(`需要 ${ENHANCE_ART_COST} 金币。`);
      return;
    }
    if (!window.confirm(`花费 ${ENHANCE_ART_COST} 金币为 ${card.name} 生成?`)) return;
    setTokens(prev => prev - ENHANCE_ART_COST);
    setIsEnhancingId(cardId);
    const artUrl = await generateCardArt(card);
    if (artUrl) {
      setKnownCards(prev => ({ ...prev, [cardId]: { ...prev[cardId], imageUrl: artUrl } }));
    } else {
      setTokens(prev => prev + ENHANCE_ART_COST); 
      alert("生成失败。");
    }
    setIsEnhancingId(null);
  };

  const handleDevCheat = () => {
    setTokens(prev => prev + 10000000);
    setInventory(prev => {
        const newInv = { ...prev };
        (Object.values(knownCards) as CardData[]).forEach(card => {
            for (let r = Rarity.COMMON; r <= Rarity.LEGENDARY; r++) {
                const key = `${card.id}_${r}`;
                newInv[key] = (newInv[key] || 0) + 1;
            }
        });
        return newInv;
    });
    alert("已获得 10,000,000 金币 和 全图鉴全等级卡牌！");
  };

  // --- Battle System Logic ---

  const getSkillsForCard = (card: CardData): Skill[] => {
      return SKILL_DATABASE[card.type] || SKILL_DATABASE['DEFAULT'];
  };

  const getStageEnemy = useCallback((zoneIdx: number, stage: number): CardData => {
      const zone = ZONES[zoneIdx];
      if (stage === STAGES_PER_ZONE) {
          return knownCards[zone.bossId] || MASTER_CARDS.find(c => c.id === zone.bossId) || MASTER_CARDS[0];
      }
      let pool = MASTER_CARDS.filter(c => zone.allowedTypes.includes(c.type) && c.id !== zone.bossId);
      if (pool.length === 0) pool = MASTER_CARDS;
      pool.sort((a, b) => a.id.localeCompare(b.id));
      const seed = (zoneIdx * 100) + stage;
      const index = seed % pool.length;
      return pool[index];
  }, [knownCards]);


  const startBattle = (type: 'adventure' | 'training') => {
    // Build Player Team from IDs
    const team: BattleCard[] = selectedTeamIds.map(key => {
        const [id, rStr] = key.split('_');
        const r = parseInt(rStr) as Rarity;
        const base = knownCards[id];
        const awakeningLvl = awakening[id] || 0;
        
        // Stats Logic
        const HP_MULTIPLIER = 12; 
        const rarityMult = 1 + ((r - 1) * 0.5);
        const awakenMult = 1 + (awakeningLvl * 0.2);
        const hp = Math.floor(base.hp * HP_MULTIPLIER * rarityMult * awakenMult);
        const atk = Math.floor(base.attack * rarityMult * awakenMult);

        return {
            ...base,
            rarity: r,
            maxHp: hp,
            currentHp: hp,
            attack: atk,
            awakeningLevel: awakeningLvl,
            skills: getSkillsForCard(base)
        };
    });

    if (team.length === 0) return; // Should block in UI

    const zoneIdx = adventure.currentZoneIndex;
    const stageIdx = adventure.currentStage;
    const isBoss = type === 'adventure' && stageIdx === STAGES_PER_ZONE;

    let baseEnemyRarity = Math.min(5, Math.max(1, Math.floor(zoneIdx / 1) + 1)) as Rarity;
    if (isBoss) baseEnemyRarity = Math.min(5, Math.max(baseEnemyRarity + 1, ZONES[zoneIdx].bossRarityMin)) as Rarity;

    let enemyBase: CardData;
    if (type === 'adventure') {
        enemyBase = getStageEnemy(zoneIdx, stageIdx);
    } else {
        const zone = ZONES[zoneIdx];
        const pool = MASTER_CARDS.filter(c => zone.allowedTypes.includes(c.type)); 
        const finalPool = pool.length > 0 ? pool : MASTER_CARDS;
        enemyBase = finalPool[Math.floor(Math.random() * finalPool.length)];
    }

    const difficulty = (1 + (zoneIdx * 0.5)) * (1 + ((stageIdx - 1) * 0.1));
    const enemyHP = Math.floor(enemyBase.hp * 12 * (1 + ((baseEnemyRarity - 1) * 0.5)) * difficulty * (isBoss ? 3.0 : 1));
    const enemyAtk = Math.floor(enemyBase.attack * (1 + ((baseEnemyRarity - 1) * 0.5)) * difficulty * (isBoss ? 1.2 : 1));

    const enemyBattleCard: BattleCard = {
        ...enemyBase,
        rarity: baseEnemyRarity,
        maxHp: enemyHP,
        currentHp: enemyHP,
        attack: enemyAtk,
        awakeningLevel: 0,
        skills: getSkillsForCard(enemyBase)
    };

    setBattleState({
      playerTeam: team,
      activeCardIndex: 0,
      enemyCard: enemyBattleCard,
      turn: 1,
      logs: isBoss 
        ? [`⚠️ 警告! 区域 BOSS ${enemyBase.name} 出现了!`]
        : [`遭遇了野生 ${enemyBase.name} (Lv.${baseEnemyRarity * 10})!`],
      isPlayerTurn: true,
      status: BattleStatus.ACTIVE,
      isBoss,
      battleType: type,
      reward: Math.floor(BATTLE_REWARD_BASE * difficulty * (isBoss ? 5 : 1) * baseEnemyRarity),
      playerCooldowns: [0, 0, 0],
      enemyCooldowns: [0, 0, 0],
      playerBuffs: [],
      enemyBuffs: [],
    });
    setView('battle');
  };

  const handleRun = () => {
      if (!battleState) return;
      setBattleState(prev => ({ 
          ...prev!, 
          status: BattleStatus.RUNNING, 
          logs: [...prev!.logs, "逃跑中..."] 
      }));
      setTimeout(() => {
          setBattleState(null);
          setView('adventure');
      }, 1000);
  };

  const handleSwitch = (newIndex: number) => {
      if (!battleState) return;
      
      // Reset Buffs and Cooldowns for player on switch (Simplification)
      setBattleState(prev => ({
          ...prev!,
          activeCardIndex: newIndex,
          playerBuffs: [], // Remove buffs on switch
          playerCooldowns: [0, 0, 0], // Reset CD on switch (optional balance choice)
          logs: [...prev!.logs, `去吧! ${prev!.playerTeam[newIndex].name}!`],
          status: BattleStatus.ACTIVE, // If we were waiting for switch, now active
          isPlayerTurn: false // Switch takes turn
      }));
      
      // Trigger Enemy Attack after switch delay
      setTimeout(() => executeEnemyTurn(), 500);
  };

  const checkWinCondition = (newState: BattleState) => {
      const { playerTeam, enemyCard, battleType, isBoss, reward } = newState;
      
      if (enemyCard.currentHp <= 0) {
          // WIN
          setTokens(t => t + reward);
          let endMsg = `战斗胜利! 获得了 ${reward} 金币!`;
          if (battleType === 'adventure') {
              if (isBoss) {
                  endMsg += ` 区域通关! 开启新区域!`;
                  setAdventure(prev => ({
                      currentZoneIndex: Math.min(ZONES.length - 1, prev.currentZoneIndex + 1),
                      currentStage: 1,
                      unlockedZones: Math.max(prev.unlockedZones, prev.currentZoneIndex + 1)
                  }));
              } else {
                  endMsg += ` 进度推进!`;
                  setAdventure(prev => ({ ...prev, currentStage: prev.currentStage + 1 }));
              }
          }
          return { ...newState, status: BattleStatus.WON, logs: [...newState.logs, endMsg] };
      }

      // Check if active player died
      const activePlayer = playerTeam[newState.activeCardIndex];
      if (activePlayer.currentHp <= 0) {
          const hasAliveMembers = playerTeam.some(p => p.currentHp > 0);
          if (hasAliveMembers) {
              return { ...newState, status: BattleStatus.WAITING_FOR_SWITCH, logs: [...newState.logs, `${activePlayer.name} 倒下了!`] };
          } else {
              return { ...newState, status: BattleStatus.LOST, logs: [...newState.logs, "全员战败... 请提升实力再来!"] };
          }
      }

      return newState;
  };

  const executeTurn = (skillIndex: number = 0) => {
    if (!battleState || battleState.status !== BattleStatus.ACTIVE) return;
    
    // --- Player Turn ---
    let currentState = { ...battleState };
    let activePlayer = currentState.playerTeam[currentState.activeCardIndex];
    let enemy = currentState.enemyCard;
    let pBuffs = currentState.playerBuffs;
    let eBuffs = currentState.enemyBuffs;
    let logs = [...currentState.logs];

    const playerSkill = activePlayer.skills[skillIndex];
    if (!playerSkill) return;

    const newPlayerCD = [...currentState.playerCooldowns];
    newPlayerCD[skillIndex] = playerSkill.cd + 1;

    logs.push(`${activePlayer.name} 使用了 [${playerSkill.name}]!`);
    
    // Calc Player Damage
    let playerResult: HitMeta = { value: 0, type: playerSkill.type, isCrit: false, isEffective: false };
    const atkBuff = pBuffs.reduce((acc, b) => b.type === 'BUFF_ATK' ? acc + b.value : acc, 0);
    const defDebuff = eBuffs.reduce((acc, b) => b.type === 'DEBUFF_DEF' ? acc + b.value : acc, 0);
    
    if (playerSkill.type === 'DAMAGE') {
        const typeMultipliers = TYPE_CHART[activePlayer.type] || {};
        const typeMult = typeMultipliers[enemy.type] || 1.0;
        let rawDmg = activePlayer.attack * playerSkill.power * typeMult * (0.9 + Math.random() * 0.2);
        if (atkBuff > 0) rawDmg *= (1 + atkBuff);
        if (defDebuff > 0) rawDmg *= (1 + defDebuff);

        if (activePlayer.awakeningLevel >= 1 && Math.random() < 0.25) {
             rawDmg *= 1.5;
             logs.push("💥 会心一击!");
             playerResult.isCrit = true;
        }

        let damage = Math.floor(rawDmg);
        if (typeMult > 1) playerResult.isEffective = true;
        playerResult.value = damage;

        if (activePlayer.awakeningLevel >= 3 && damage > 0) {
            const healAmt = Math.floor(damage * 0.25);
            activePlayer = { ...activePlayer, currentHp: Math.min(activePlayer.maxHp, activePlayer.currentHp + healAmt) };
            logs.push(`✨ 吸取了 ${healAmt} 点体力!`);
        }
        
        enemy = { ...enemy, currentHp: Math.max(0, enemy.currentHp - damage) };
        logs.push(`造成了 ${damage} 点伤害!`);
    } else if (playerSkill.type === 'HEAL') {
        const healAmt = Math.floor(activePlayer.attack * playerSkill.power * (0.9 + Math.random() * 0.2));
        activePlayer = { ...activePlayer, currentHp: Math.min(activePlayer.maxHp, activePlayer.currentHp + healAmt) };
        playerResult.value = healAmt;
        logs.push(`恢复了 ${healAmt} 点体力!`);
    } else if (playerSkill.type === 'BUFF_ATK') {
        pBuffs = [...pBuffs, { type: 'BUFF_ATK', duration: 3, value: playerSkill.power - 1 }];
        logs.push(`攻击力大幅提升!`);
    } else if (playerSkill.type === 'DEBUFF_DEF') {
        eBuffs = [...eBuffs, { type: 'DEBUFF_DEF', duration: 3, value: playerSkill.power }];
        logs.push(`对手防御降低!`);
    }

    // Update State after Player Move
    const playerTeam = [...currentState.playerTeam];
    playerTeam[currentState.activeCardIndex] = activePlayer;

    currentState = {
        ...currentState,
        playerTeam,
        enemyCard: enemy,
        playerCooldowns: newPlayerCD,
        playerBuffs: pBuffs,
        enemyBuffs: eBuffs,
        logs,
        playerResult,
        lastPlayerAction: playerSkill.type,
        isPlayerTurn: false
    };

    currentState = checkWinCondition(currentState);
    setBattleState(currentState);

    if (currentState.status === BattleStatus.ACTIVE) {
        setTimeout(() => executeEnemyTurn(), 1000); // Trigger Enemy Turn
    }
  };

  // Separated Enemy Turn logic to allow calling it after Switch
  const executeEnemyTurn = () => {
    setBattleState(prevState => {
        if (!prevState || prevState.status !== BattleStatus.ACTIVE) return prevState;
        
        let activePlayer = prevState.playerTeam[prevState.activeCardIndex];
        let enemy = prevState.enemyCard;
        let logs = [...prevState.logs];
        let pBuffs = prevState.playerBuffs;
        let eBuffs = prevState.enemyBuffs;
        let enemyCD = [...prevState.enemyCooldowns];

        // Choose Skill
        const availableSkills = enemy.skills.map((s, i) => ({ s, i })).filter(({ i }) => enemyCD[i] <= 0);
        const move = availableSkills.length > 0 ? availableSkills[Math.floor(Math.random() * availableSkills.length)] : { s: enemy.skills[0], i: 0 };
        enemyCD[move.i] = move.s.cd + 1;

        logs.push(`敌方 ${enemy.name} 使用了 [${move.s.name}]!`);

        let enemyResult: HitMeta = { value: 0, type: move.s.type, isCrit: false, isEffective: false };
        const enemyAtkBuff = eBuffs.reduce((acc, b) => b.type === 'BUFF_ATK' ? acc + b.value : acc, 0);
        const playerDefDebuff = pBuffs.reduce((acc, b) => b.type === 'DEBUFF_DEF' ? acc + b.value : acc, 0);

        if (move.s.type === 'DAMAGE') {
            const typeMultipliers = TYPE_CHART[enemy.type] || {};
            const typeMult = typeMultipliers[activePlayer.type] || 1.0;
            let rawDmg = enemy.attack * move.s.power * typeMult * (0.9 + Math.random() * 0.2);
            if (enemyAtkBuff > 0) rawDmg *= (1 + enemyAtkBuff);
            if (playerDefDebuff > 0) rawDmg *= (1 + playerDefDebuff);

            let dmg = Math.floor(rawDmg);
            if (typeMult > 1) enemyResult.isEffective = true;
            enemyResult.value = dmg;
            
            activePlayer = { ...activePlayer, currentHp: Math.max(0, activePlayer.currentHp - dmg) };
            logs.push(`受到了 ${dmg} 点伤害!`);
        } else if (move.s.type === 'HEAL') {
            const healAmt = Math.floor(enemy.attack * move.s.power * (0.9 + Math.random() * 0.2));
            enemy = { ...enemy, currentHp: Math.min(enemy.maxHp, enemy.currentHp + healAmt) };
            enemyResult.value = healAmt;
            logs.push(`恢复了 ${healAmt} 点体力!`);
        } else if (move.s.type === 'BUFF_ATK') {
            eBuffs = [...eBuffs, { type: 'BUFF_ATK', duration: 3, value: move.s.power - 1 }];
            logs.push(`敌方攻击力提升!`);
        } else if (move.s.type === 'DEBUFF_DEF') {
            pBuffs = [...pBuffs, { type: 'DEBUFF_DEF', duration: 3, value: move.s.power }];
            logs.push(`我方防御降低!`);
        }

        // Cooldowns & Buffs Decay
        const nextPlayerCD = prevState.playerCooldowns.map(c => Math.max(0, c - 1));
        const nextEnemyCD = enemyCD.map(c => Math.max(0, c - 1));
        const nextPBuffs = pBuffs.map(b => ({...b, duration: b.duration - 1})).filter(b => b.duration > 0);
        const nextEBuffs = eBuffs.map(b => ({...b, duration: b.duration - 1})).filter(b => b.duration > 0);

        const playerTeam = [...prevState.playerTeam];
        playerTeam[prevState.activeCardIndex] = activePlayer;

        let newState = {
            ...prevState,
            playerTeam,
            enemyCard: enemy,
            logs,
            playerCooldowns: nextPlayerCD,
            enemyCooldowns: nextEnemyCD,
            playerBuffs: nextPBuffs,
            enemyBuffs: nextEBuffs,
            lastEnemyAction: move.s.type,
            enemyResult,
            isPlayerTurn: true,
            turn: prevState.turn + 1
        };

        return checkWinCondition(newState);
    });
  };


  // ... (Title Screen Render is same) ...
  if (!gameStarted) {
      return (
          <div className="h-[100dvh] w-full bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <div className="scanline-bg pointer-events-none z-[60]"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
              
              <div className="z-10 text-center space-y-8">
                  <div className="space-y-2">
                       <div className="w-24 h-24 bg-red-600 rounded-full border-8 border-white shadow-[0_0_40px_rgba(239,68,68,0.6)] mx-auto flex items-center justify-center relative overflow-hidden animate-pulse">
                            <div className="absolute top-[45%] left-0 w-full h-2 bg-black/20"></div>
                            <div className="w-8 h-8 bg-white rounded-full border-4 border-slate-300/50"></div>
                       </div>
                       <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter drop-shadow-[4px_4px_0_#ef4444]">POKéGEN</h1>
                       <p className="text-slate-400 tracking-widest uppercase text-sm">AI Monster Collector</p>
                  </div>

                  <div className="flex flex-col gap-4 w-64 mx-auto">
                      <button onClick={handleStartNewGame} className="retro-btn py-4 text-xl font-bold rounded shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2">
                          <Play className="w-6 h-6 fill-white" /> 开始冒险
                      </button>
                      
                      <label className="retro-btn py-3 bg-slate-700 border-slate-600 text-slate-300 font-bold rounded cursor-pointer flex items-center justify-center gap-2">
                          <Upload className="w-5 h-5" /> 读取存档
                          <input type="file" accept=".save" onChange={handleImportSave} className="hidden" />
                      </label>
                  </div>
              </div>
              <div className="absolute bottom-4 text-slate-600 text-xs font-mono">v1.6.0 - Team Battle Update</div>
          </div>
      );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-800 font-sans overflow-hidden relative">
      <div className="scanline-bg pointer-events-none z-[60]"></div>

      <header className="flex-none bg-[#ef4444] border-b-4 border-[#991b1b] p-3 flex justify-between items-center z-50 shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-400 rounded-full border-4 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
          <h1 className="text-xl font-bold text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] tracking-widest hidden sm:block">POKéGEN</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-1 rounded border-2 border-slate-600 shadow-inner">
              <Wallet className="w-4 h-4 text-[#fbbf24]" />
              <span className="font-mono font-bold text-[#fbbf24] text-lg tracking-wide">{tokens.toLocaleString()}</span>
           </div>
           <button onClick={toggleFullScreen} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded border-2 border-slate-500 text-white active:scale-95 transition-transform">
             {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-[#e2e8f0] flex flex-col relative">
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none z-10"></div>
        
        <div className={`flex-1 overflow-y-auto h-full ${view === 'battle' ? 'p-0' : 'p-0 sm:p-2'}`}>
          {view === 'inventory' && (
            <InventoryGrid 
              inventory={inventory} knownCards={knownCards} awakening={awakening}
              onMerge={handleMerge} onEnhanceArt={handleEnhanceArt} onAwaken={handleAwaken} enhancingId={isEnhancingId}
            />
          )}

          {view === 'adventure' && (
             <AdventureView 
                progress={adventure} inventory={inventory} knownCards={knownCards} awakening={awakening}
                onStartBattle={startBattle} selectedTeamIds={selectedTeamIds} onSelectCard={handleSelectCard} getStageEnemy={getStageEnemy}
             />
          )}

          {view === 'battle' && battleState && (
             <BattleArena battleState={battleState} onAttack={executeTurn} onSwitch={handleSwitch} onRun={handleRun} onLeave={() => setView('adventure')} />
          )}
          
          {view === 'pokedex' && (
             <PokedexView knownCards={knownCards} inventory={inventory} />
          )}

          {view === 'gacha' && (
            <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-8 pb-24">
              <div className="retro-container bg-[#f0f9ff] p-6 max-w-lg w-full text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">卡牌商店</h2>
                <p className="text-slate-600 text-lg">
                  当前图鉴: <span className="font-bold text-blue-600">{Object.keys(knownCards).length}</span> / {MASTER_CARDS.length}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
                {/* Gacha Box */}
                <div className="retro-container bg-white p-4 flex flex-col items-center gap-4 hover:bg-blue-50 transition-colors cursor-pointer group" onClick={() => handleBuyDraw(1)}>
                   <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center border-4 border-slate-300 group-hover:border-red-500 transition-colors">
                      <Joystick className="w-8 h-8 text-slate-600 group-hover:text-red-500" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800">购买卡包</h3>
                   <div className="flex gap-2 w-full">
                      <button onClick={(e) => { e.stopPropagation(); handleBuyDraw(1); }} className="retro-btn flex-1 py-2 font-bold text-sm rounded">x1 (100G)</button>
                      <button onClick={(e) => { e.stopPropagation(); handleBuyDraw(10); }} className="retro-btn flex-1 py-2 bg-purple-600 border-purple-800 font-bold text-sm rounded">x10 (1000G)</button>
                   </div>
                </div>

                {/* Scout Box */}
                <div className="retro-container bg-white p-4 flex flex-col items-center gap-4 hover:bg-green-50 transition-colors">
                   <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center border-4 border-slate-300">
                      <Search className={`w-8 h-8 text-slate-600 ${isScouting ? 'animate-spin' : ''}`} />
                   </div>
                   <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-800">探索图鉴</h3>
                      <p className="text-xs text-slate-500 mt-1">发现新的物种</p>
                   </div>
                   <button onClick={handleScout} disabled={isScouting} className="retro-btn w-full py-2 bg-green-600 border-green-800 font-bold text-sm rounded disabled:opacity-50 disabled:bg-gray-500">
                      {isScouting ? '探索中...' : `出发! (${SCOUT_COST}G)`}
                    </button>
                </div>
              </div>

              {/* Save Controls - Simplified */}
              <div className="w-full max-w-3xl px-4 pt-6 border-t-2 border-slate-300">
                 <div className="flex gap-2 justify-center">
                     <button onClick={handleExportSave} className="retro-btn px-4 py-2 bg-slate-600 border-slate-700 flex items-center gap-2 text-xs">
                        <Download className="w-4 h-4" /> 备份存档 (本地下载)
                     </button>
                     <button onClick={handleLogout} className="retro-btn px-4 py-2 bg-red-600 border-red-700 flex items-center gap-2 text-xs text-white">
                        <LogOut className="w-4 h-4" /> 退出登录 (清除缓存)
                     </button>
                 </div>
              </div>

              {/* Developer Cheat Button */}
              <div className="w-full max-w-3xl px-4 pt-6 flex justify-center">
                  <button onClick={handleDevCheat} className="text-xs text-slate-300 underline hover:text-slate-500">
                      [DEV] 获取测试大礼包
                  </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* --- Tab Navigation --- */}
      <nav className="bg-white border-t-4 border-slate-700 pb-6 pt-2 px-2 flex justify-around items-end h-24 shrink-0 relative z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        
        <button 
            onClick={() => setView('inventory')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'inventory' ? 'text-blue-600 -translate-y-3 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-full border-2 ${view === 'inventory' ? 'bg-blue-50 border-blue-500 shadow-lg' : 'border-transparent'}`}>
             <Layers className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold font-mono">背包</span>
        </button>

        <button 
            onClick={() => setView('adventure')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'adventure' ? 'text-red-600 -translate-y-3 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-full border-2 ${view === 'adventure' ? 'bg-red-50 border-red-500 shadow-lg' : 'border-transparent'}`}>
             <Compass className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold font-mono">冒险</span>
        </button>

        <button 
            onClick={() => setView('gacha')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'gacha' ? 'text-yellow-600 -translate-y-3 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-full border-2 ${view === 'gacha' ? 'bg-yellow-50 border-yellow-500 shadow-lg' : 'border-transparent'}`}>
             <Joystick className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold font-mono">商店</span>
        </button>
        
        <button 
            onClick={() => setView('pokedex')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'pokedex' ? 'text-green-600 -translate-y-3 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-full border-2 ${view === 'pokedex' ? 'bg-green-50 border-green-500 shadow-lg' : 'border-transparent'}`}>
             <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold font-mono">图鉴</span>
        </button>
      </nav>

      {/* Modals */}
      
      {/* Starter Pack Modal */}
      {showStarterModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in">
           <div className="retro-container bg-white max-w-sm w-full p-6 text-center relative">
               <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <Gift className="w-16 h-16 text-red-500 drop-shadow-lg animate-bounce" />
               </div>
               <h2 className="text-2xl font-bold mt-6 mb-2 text-slate-800">大木博士的礼物</h2>
               <p className="text-slate-600 mb-6">
                  "欢迎来到这个世界！<br/>这 10 个精灵球是你冒险的开始，<br/>去收集所有的宝可梦吧！"
               </p>
               <button onClick={claimStarterPack} className="retro-btn w-full py-3 text-lg rounded shadow-lg animate-pulse">
                  领取 10 连抽
               </button>
           </div>
        </div>
      )}

      {/* Draw Result Modal */}
      {showDrawModal && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 overflow-y-auto">
           <div className="w-full max-w-4xl flex flex-col items-center my-auto">
               <div className="flex justify-between items-center w-full max-w-lg mb-4 text-white">
                   <h2 className="text-2xl font-bold tracking-wider">!! GOTCHA !!</h2>
                   <button onClick={() => setShowDrawModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X /></button>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                  {drawnCards.map((item, idx) => {
                      const cardData = knownCards[item.cardId];
                      return (
                          <div key={idx} className="animate-pop-in" style={{ animationDelay: `${idx * 100}ms` }}>
                             <CardView 
                               data={cardData} 
                               rarity={item.rarity} 
                               isNew={item.isNew}
                               showEnhance={false}
                             />
                          </div>
                      );
                  })}
               </div>

               <div className="flex gap-4">
                  <button 
                     onClick={() => {
                        setShowDrawModal(false);
                        handleBuyDraw(lastDrawAmount);
                     }} 
                     className="retro-btn bg-yellow-500 border-yellow-700 text-black px-8 py-3 font-bold rounded shadow-lg hover:scale-105 transition-transform"
                  >
                     再来 x{lastDrawAmount} ({lastDrawAmount * 100}G)
                  </button>
                  <button 
                     onClick={() => setShowDrawModal(false)} 
                     className="retro-btn bg-slate-600 border-slate-800 px-8 py-3 font-bold rounded shadow-lg hover:scale-105 transition-transform"
                  >
                     关闭
                  </button>
               </div>
           </div>
        </div>
      )}

    </div>
  );
}
