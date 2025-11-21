
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_TOKENS, SCOUT_COST, ENHANCE_ART_COST, TYPE_CHART, BATTLE_REWARD_BASE, STAGES_PER_ZONE, ZONES, STARTER_PACK_SIZE, SKILL_DATABASE, MASTER_CARDS, STARTER_DEX_IDS } from './constants';
import { CardData, Inventory, Rarity, BattleState, AdventureProgress, Skill, BattleCard, Buff, HitMeta, GameState, BattleStatus } from './types';
import { generateCardArt } from './services/geminiService';
import { audioService } from './services/audioService';
import { CardView } from './components/CardView';
import { InventoryGrid } from './components/InventoryGrid';
import { BattleArena } from './components/BattleArena';
import { AdventureView } from './components/AdventureView';
import { PokedexView } from './components/PokedexView';
import { Layers, Compass, X, Wallet, Maximize2, Minimize2, Joystick, Search, BookOpen, Gift, Upload, Download, Play, LogOut, HelpCircle, AlertTriangle, Trophy, Volume2, VolumeX, Skull } from 'lucide-react';

interface NotificationState {
    isOpen: boolean;
    type: 'alert' | 'confirm';
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [view, setView] = useState<'inventory' | 'gacha' | 'battle' | 'adventure' | 'pokedex'>('gacha');
  
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
  
  const [showStarterModal, setShowStarterModal] = useState(false);
  const [drawnCards, setDrawnCards] = useState<{cardId: string, rarity: Rarity, isNew: boolean}[]>([]);
  const [lastDrawAmount, setLastDrawAmount] = useState<number>(0); 
  const [isScouting, setIsScouting] = useState(false);
  const [isEnhancingId, setIsEnhancingId] = useState<string | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]); 
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [notification, setNotification] = useState<NotificationState>({ isOpen: false, type: 'alert', message: '' });

  useEffect(() => {
      const unlockAudio = () => {
          audioService.init();
          document.removeEventListener('click', unlockAudio);
      };
      document.addEventListener('click', unlockAudio);
      return () => document.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
      if (!gameStarted) {
          audioService.playBgm('TITLE');
      } else if (view === 'battle') {
          if (battleState?.isBoss) audioService.playBgm('BOSS');
          else audioService.playBgm('BATTLE');
      } else {
          audioService.playBgm('LOBBY');
      }
  }, [gameStarted, view, battleState?.isBoss]);

  const toggleMute = () => {
      const muted = audioService.toggleMute();
      setIsMuted(muted);
      audioService.playSfx('CLICK');
  };

  const showAlert = (message: string) => {
      audioService.playSfx('CLICK');
      setNotification({ 
          isOpen: true, 
          type: 'alert', 
          message, 
          onConfirm: () => {
              audioService.playSfx('CLICK');
              setNotification(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
      audioService.playSfx('CLICK');
      setNotification({
          isOpen: true,
          type: 'confirm',
          message,
          onConfirm: () => {
              audioService.playSfx('CLICK');
              onConfirm();
              setNotification(prev => ({ ...prev, isOpen: false }));
          },
          onCancel: () => {
              audioService.playSfx('CANCEL');
              if (onCancel) onCancel();
              setNotification(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

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
      try {
          const json = decodeURIComponent(escape(atob(encoded)));
          return JSON.parse(json);
      } catch (e) {
          console.error("Decryption failed, trying legacy parse", e);
          return JSON.parse(encoded);
      }
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
      audioService.playSfx('START');
      if (localStorage.getItem('pokegen_save_v1')) {
          showConfirm("发现已有存档，开始新游戏将覆盖它。确定吗？", () => {
              initializeNewGame();
          });
      } else {
          initializeNewGame();
      }
  };
  
  const handleContinueGame = () => {
      audioService.playSfx('START');
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
             showAlert("存档损坏，无法读取");
          }
      }
  };

  const initializeNewGame = () => {
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
      audioService.playSfx('CLICK');
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

              audioService.playSfx('START');
              localStorage.setItem('pokegen_save_v1', JSON.stringify(state));
              setKnownCards(state.knownCards);
              setInventory(state.inventory);
              setTokens(state.tokens);
              setAdventure(state.adventure);
              setHasClaimedStarter(state.hasClaimedStarter);
              setAwakening(state.awakening || {});
              setGameStarted(true);
              showAlert("存档读取成功!");
              
          } catch (err) {
              showAlert("存档读取失败: 文件已损坏或格式错误");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };
  
  const handleLogout = () => {
      showConfirm("确定要退出登录并清除本地存档吗？此操作不可逆！", () => {
          audioService.playSfx('CANCEL');
          localStorage.removeItem('pokegen_save_v1');
          window.location.reload();
      });
  };

  const toggleFullScreen = () => {
    audioService.playSfx('CLICK');
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
    audioService.playSfx('EVOLVE');
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
     audioService.playSfx('EVOLVE');
     const key = `${cardId}_${Rarity.LEGENDARY}`;
     const count = inventory[key] || 0;
     const currentLevel = awakening[cardId] || 0;

     if (count > 1 && currentLevel < 5) {
         setInventory(prev => ({ ...prev, [key]: prev[key] - 1 }));
         setAwakening(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + 1 }));
         showAlert(`界限突破成功! ${knownCards[cardId].name} 等级提升至 +${currentLevel + 1}!`);
     }
  };

  const handleSelectCard = (key: string) => {
      audioService.playSfx('CLICK');
      setSelectedTeamIds(prev => {
          if (prev.includes(key)) {
              return prev.filter(k => k !== key);
          } else {
              if (prev.length >= 6) {
                  showAlert("队伍已满 (最多6只)!");
                  return prev;
              }
              return [...prev, key];
          }
      });
  };

  const claimStarterPack = () => {
      audioService.playSfx('GET');
      setHasClaimedStarter(true);
      setShowStarterModal(false);
      setLastDrawAmount(STARTER_PACK_SIZE);
      
      const results: {cardId: string, rarity: Rarity, isNew: boolean}[] = [];
      const allIds = Object.keys(knownCards);
      
      const guaranteed = [
          { id: 'charmander', rarity: Rarity.RARE },
          { id: 'squirtle', rarity: Rarity.RARE },
          { id: 'bulbasaur', rarity: Rarity.RARE },
      ];

      guaranteed.forEach(g => {
          const hasAnyCopy = Object.keys(inventory).some(k => k.startsWith(g.id));
          addToInventory(g.id, g.rarity);
          results.push({ cardId: g.id, rarity: g.rarity, isNew: !hasAnyCopy });
      });

      for (let i = 0; i < STARTER_PACK_SIZE - 3; i++) {
          const randomId = allIds[Math.floor(Math.random() * allIds.length)];
          const r = Math.random();
          let rarity = Rarity.COMMON;
          if (r > 0.98) rarity = Rarity.EPIC;
          else if (r > 0.90) rarity = Rarity.RARE;
          else if (r > 0.60) rarity = Rarity.UNCOMMON;

          const hasAnyCopy = Object.keys(inventory).some(k => k.startsWith(randomId));
          addToInventory(randomId, rarity);
          results.push({ cardId: randomId, rarity, isNew: !hasAnyCopy });
      }

      setDrawnCards(results);
      setShowDrawModal(true);
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
    audioService.playSfx('GET');
    if (hasClaimedStarter) setTokens(prev => prev + (amount * 2));
  };

  const handleBuyDraw = (amount: number) => {
      audioService.playSfx('CLICK');
      const drawCost = amount * 100;
      if (tokens < drawCost) {
          showAlert("金币不足！需要去冒险赚取金币。");
          return;
      }
      setTokens(prev => prev - drawCost);
      setLastDrawAmount(amount); 
      drawCards(amount);
  };

  const handleScout = async () => {
    audioService.playSfx('CLICK');
    if (tokens < SCOUT_COST) {
      showAlert("金币不足!");
      return;
    }
    setIsScouting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const knownIds = Object.keys(knownCards);
    const availablePool = MASTER_CARDS.filter(c => !knownIds.includes(c.id));
    if (availablePool.length === 0) {
        showAlert("你已经发现了所有物种！");
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
    audioService.playSfx('GET');
    showAlert(`发现新物种!\n${newDiscoveries.map(c => `• ${c.name}`).join('\n')}`);
    setIsScouting(false);
  };

  const handleEnhanceArt = async (cardId: string) => {
    audioService.playSfx('CLICK');
    const card = knownCards[cardId];
    if (card.imageUrl) return; 
    if (tokens < ENHANCE_ART_COST) {
      showAlert(`需要 ${ENHANCE_ART_COST} 金币。`);
      return;
    }
    
    showConfirm(`花费 ${ENHANCE_ART_COST} 金币为 ${card.name} 生成专属艺术图?`, async () => {
        setTokens(prev => prev - ENHANCE_ART_COST);
        setIsEnhancingId(cardId);
        audioService.playSfx('EVOLVE');
        const artUrl = await generateCardArt(card);
        if (artUrl) {
          setKnownCards(prev => ({ ...prev, [cardId]: { ...prev[cardId], imageUrl: artUrl } }));
          audioService.playSfx('GET');
        } else {
          setTokens(prev => prev + ENHANCE_ART_COST); 
          showAlert("生成失败，金币已返还。");
        }
        setIsEnhancingId(null);
    });
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
    audioService.playSfx('GET');
    showAlert("已获得 10,000,000 金币 和 全图鉴全等级卡牌！");
  };

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
    audioService.playSfx('START');
    
    const team: BattleCard[] = selectedTeamIds.map(key => {
        const [id, rStr] = key.split('_');
        const r = parseInt(rStr) as Rarity;
        const base = knownCards[id];
        const awakeningLvl = awakening[id] || 0;
        
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

    if (team.length === 0) {
        showAlert("请先编辑队伍，至少选择一只宝可梦出战！");
        return;
    }

    const zoneIdx = adventure.currentZoneIndex;
    const stageIdx = adventure.currentStage;
    const isBoss = type === 'adventure' && stageIdx === STAGES_PER_ZONE;

    let baseEnemyRarity = Math.min(5, Math.max(1, Math.floor(zoneIdx / 2) + 1)) as Rarity;
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

    const zoneDifficulty = 1 + (zoneIdx * 0.05); 
    const difficulty = zoneDifficulty;
    const bossHpMult = isBoss ? 1.3 : 1; 
    const bossAtkMult = isBoss ? 0.9 : 1;

    const enemyHP = Math.floor(enemyBase.hp * 12 * (1 + ((baseEnemyRarity - 1) * 0.5)) * difficulty * bossHpMult);
    const enemyAtk = Math.floor(enemyBase.attack * (1 + ((baseEnemyRarity - 1) * 0.5)) * difficulty * bossAtkMult);

    const enemyBattleCard: BattleCard = {
        ...enemyBase,
        rarity: baseEnemyRarity,
        maxHp: enemyHP,
        currentHp: enemyHP,
        attack: enemyAtk,
        awakeningLevel: 0,
        skills: getSkillsForCard(enemyBase)
    };

    const bossRewardMult = isBoss ? 10 : 1;
    const rewardAmt = Math.floor(BATTLE_REWARD_BASE * difficulty * bossRewardMult * baseEnemyRarity);

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
      reward: rewardAmt,
      playerCooldowns: [0, 0, 0],
      enemyCooldowns: [0, 0, 0],
      playerBuffs: [],
      enemyBuffs: [],
    });
    setView('battle');
    audioService.playCry(enemyBase.id);
  };

  const handleRun = () => {
      if (!battleState) return;
      audioService.playSfx('RUN');
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
      audioService.playSfx('CLICK');
      setBattleState(prev => ({
          ...prev!,
          activeCardIndex: newIndex,
          playerBuffs: [], 
          playerCooldowns: [0, 0, 0],
          logs: [...prev!.logs, `去吧! ${prev!.playerTeam[newIndex].name}!`],
          status: BattleStatus.ACTIVE, 
          isPlayerTurn: false 
      }));
      const pokemon = battleState.playerTeam[newIndex];
      audioService.playCry(pokemon.id);
      setTimeout(() => executeEnemyTurn(), 500);
  };

  const checkWinCondition = (newState: BattleState) => {
      const { playerTeam, enemyCard, battleType, isBoss, reward } = newState;
      if (enemyCard.currentHp <= 0) {
          audioService.playBgm('VICTORY');
          setTokens(t => t + reward);
          let endMsg = `战斗胜利!`;
          if (battleType === 'adventure') {
              if (isBoss) {
                  endMsg += ` 区域通关!`;
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
      const activePlayer = playerTeam[newState.activeCardIndex];
      if (activePlayer.currentHp <= 0) {
          const hasAliveMembers = playerTeam.some(p => p.currentHp > 0);
          if (hasAliveMembers) {
              return { ...newState, status: BattleStatus.WAITING_FOR_SWITCH, logs: [...newState.logs, `${activePlayer.name} 倒下了!`] };
          } else {
              audioService.stopBgm(); 
              return { ...newState, status: BattleStatus.LOST, logs: [...newState.logs, "全员战败... 请提升实力再来!"] };
          }
      }
      return newState;
  };

  const executeTurn = (skillIndex: number = 0) => {
    if (!battleState || battleState.status !== BattleStatus.ACTIVE) return;
    let currentState = { ...battleState };
    let activePlayer = currentState.playerTeam[currentState.activeCardIndex];
    let enemy = currentState.enemyCard;
    let pBuffs = currentState.playerBuffs;
    let eBuffs = currentState.enemyBuffs;
    let logs = [...currentState.logs];
    const playerSkill = activePlayer.skills[skillIndex];
    if (!playerSkill) return;

    if (playerSkill.type === 'DAMAGE') audioService.playSfx('ATTACK');
    else if (playerSkill.type === 'HEAL') audioService.playSfx('HEAL');
    else audioService.playSfx('BUFF');

    const newPlayerCD = [...currentState.playerCooldowns];
    newPlayerCD[skillIndex] = playerSkill.cd + 1;
    logs.push(`${activePlayer.name} 使用了 [${playerSkill.name}]!`);
    
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
        if (damage > 0) setTimeout(() => audioService.playSfx('HIT'), 200);

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
        setTimeout(() => executeEnemyTurn(), 1000);
    }
  };

  const executeEnemyTurn = () => {
    setBattleState(prevState => {
        if (!prevState || prevState.status !== BattleStatus.ACTIVE) return prevState;
        let activePlayer = prevState.playerTeam[prevState.activeCardIndex];
        let enemy = prevState.enemyCard;
        let logs = [...prevState.logs];
        let pBuffs = prevState.playerBuffs;
        let eBuffs = prevState.enemyBuffs;
        let enemyCD = [...prevState.enemyCooldowns];

        const availableSkills = enemy.skills.map((s, i) => ({ s, i })).filter(({ i }) => enemyCD[i] <= 0);
        const move = availableSkills.length > 0 ? availableSkills[Math.floor(Math.random() * availableSkills.length)] : { s: enemy.skills[0], i: 0 };
        enemyCD[move.i] = move.s.cd + 1;
        logs.push(`敌方 ${enemy.name} 使用了 [${move.s.name}]!`);
        if (move.s.type === 'DAMAGE') setTimeout(() => audioService.playSfx('ATTACK'), 200);

        let enemyResult: HitMeta = { value: 0, type: move.s.type, isCrit: false, isEffective: false };
        if (move.s.type === 'DAMAGE') {
            const typeMultipliers = TYPE_CHART[enemy.type] || {};
            const typeMult = typeMultipliers[activePlayer.type] || 1.0;
            let rawDmg = enemy.attack * move.s.power * typeMult * (0.9 + Math.random() * 0.2);
            const defDebuff = pBuffs.reduce((acc, b) => b.type === 'DEBUFF_DEF' ? acc + b.value : acc, 0);
            if (defDebuff > 0) rawDmg *= (1 + defDebuff);
            let damage = Math.floor(rawDmg);
            if (typeMult > 1) enemyResult.isEffective = true;
            enemyResult.value = damage;
            activePlayer = { ...activePlayer, currentHp: Math.max(0, activePlayer.currentHp - damage) };
            logs.push(`${activePlayer.name} 受到了 ${damage} 点伤害!`);
            if (damage > 0) setTimeout(() => audioService.playSfx('HIT'), 400);
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

        const nextPlayerCD = prevState.playerCooldowns.map(c => Math.max(0, c - 1));
        const nextEnemyCD = enemyCD.map(c => Math.max(0, c - 1));
        const nextPBuffs = pBuffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
        const nextEBuffs = eBuffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
        const nextPlayerTeam = [...prevState.playerTeam];
        nextPlayerTeam[prevState.activeCardIndex] = activePlayer;

        let newState = {
            ...prevState,
            playerTeam: nextPlayerTeam,
            enemyCard: enemy,
            playerCooldowns: nextPlayerCD,
            enemyCooldowns: nextEnemyCD,
            playerBuffs: nextPBuffs,
            enemyBuffs: nextEBuffs,
            logs,
            enemyResult,
            lastEnemyAction: move.s.type,
            turn: prevState.turn + 1,
            isPlayerTurn: true
        };
        return checkWinCondition(newState);
    });
  };

  if (!gameStarted) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 holo-bg opacity-20 pointer-events-none"></div>
        <div className="mb-12 text-center animate-bounce-slow">
            <div className="w-24 h-24 mx-auto bg-red-600 rounded-full border-8 border-slate-100 flex items-center justify-center mb-4 shadow-xl relative">
                <div className="w-full h-1 bg-slate-800 absolute top-1/2 -translate-y-1/2"></div>
                <div className="w-8 h-8 bg-slate-100 rounded-full border-4 border-slate-800 z-10"></div>
            </div>
            <h1 className="text-6xl font-bold tracking-tighter text-yellow-400 drop-shadow-[4px_4px_0_rgba(185,28,28,1)]" style={{ fontFamily: 'VT323' }}>POKÉGEN</h1>
            <p className="text-xl text-slate-400 mt-2 font-mono">AI 收藏家</p>
        </div>
        <div className="flex flex-col gap-4 w-64 z-10">
             <button onClick={handleStartNewGame} className="retro-btn bg-blue-600 py-4 rounded text-xl font-bold shadow-xl hover:scale-105 transition-transform">开始新冒险</button>
             {localStorage.getItem('pokegen_save_v1') && (
                 <button onClick={handleContinueGame} className="retro-btn bg-green-600 py-4 rounded text-xl font-bold shadow-xl hover:scale-105 transition-transform">继续游戏</button>
             )}
             <label className="retro-btn bg-slate-600 py-3 rounded text-center cursor-pointer hover:bg-slate-500 relative overflow-hidden">
                 <span>导入存档</span>
                 <input type="file" accept=".save,.json" onChange={handleImportSave} className="absolute inset-0 opacity-0 cursor-pointer" />
             </label>
        </div>
        {notification.isOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white border-4 border-slate-800 p-6 rounded shadow-2xl max-w-xs text-center retro-container">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-lg font-bold mb-6 text-slate-800">{notification.message}</p>
                    <div className="flex gap-4 justify-center">
                        {notification.type === 'confirm' && <button onClick={notification.onCancel} className="retro-btn bg-slate-500 px-4 py-2 rounded">取消</button>}
                        <button onClick={notification.onConfirm} className="retro-btn bg-blue-600 px-6 py-2 rounded">确定</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-200 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative retro-container">
      <header className="bg-red-600 text-white p-3 flex justify-between items-center border-b-4 border-red-800 shrink-0 shadow-md z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full border-4 border-white/50 flex items-center justify-center relative overflow-hidden shadow-inner">
             <div className="w-full h-1 bg-red-800 absolute top-1/2 -translate-y-1/2"></div>
             <div className="w-3 h-3 bg-red-800 rounded-full z-10 border-2 border-white"></div>
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase drop-shadow-md" style={{ fontFamily: 'VT323' }}>POKÉGEN</h1>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-slate-800 px-3 py-1 rounded border-2 border-slate-600 flex items-center gap-2 shadow-inner">
              <Wallet className="w-4 h-4 text-yellow-400" />
              <span className="font-mono font-bold text-yellow-400 tracking-wide">{tokens.toLocaleString()}</span>
           </div>
           <button onClick={toggleMute} className="p-1.5 bg-red-700 rounded hover:bg-red-500 border-2 border-red-900 shadow">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
           <button onClick={toggleFullScreen} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 border-2 border-slate-900 shadow text-white">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative bg-slate-100 scroll-smooth no-scrollbar">
        <div className="scanline-bg z-0"></div>
        <div className="relative z-10 min-h-full">
            {view === 'inventory' && <InventoryGrid inventory={inventory} knownCards={knownCards} awakening={awakening} onMerge={handleMerge} onEnhanceArt={handleEnhanceArt} onAwaken={handleAwaken} enhancingId={isEnhancingId} onExportSave={handleExportSave} onLogout={handleLogout} />}
            {view === 'gacha' && (
            <div className="p-6 flex flex-col items-center space-y-8 pb-32">
                <div className="w-full retro-container bg-blue-50 p-6 flex flex-col items-center text-center">
                    <Compass className={`w-16 h-16 text-blue-500 mb-4 ${isScouting ? 'animate-spin' : ''}`} />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">探索新物种</h2>
                    <p className="text-slate-600 mb-6 text-sm">派出无人机寻找未知的宝可梦数据...</p>
                    <button onClick={handleScout} disabled={isScouting} onMouseEnter={() => audioService.playSfx('HOVER')} className="retro-btn w-full py-3 text-lg rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isScouting ? '探索中...' : <><Search className="w-5 h-5" /> 探索 ({SCOUT_COST} G)</>}
                    </button>
                </div>
                <div className="w-full retro-container bg-purple-50 p-6 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 opacity-10 text-purple-900 pointer-events-none"><Gift size={150} /></div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">购买卡包</h2>
                    <p className="text-slate-600 mb-6 text-sm">获取已发现的宝可梦卡牌</p>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button onClick={() => handleBuyDraw(1)} onMouseEnter={() => audioService.playSfx('HOVER')} className="retro-btn bg-white text-slate-800 border-slate-300 hover:bg-slate-50 py-4 rounded-lg flex flex-col items-center gap-1">
                            <span className="text-xl font-bold">1 张</span><span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">100 G</span>
                        </button>
                        <button onClick={() => handleBuyDraw(10)} onMouseEnter={() => audioService.playSfx('HOVER')} className="retro-btn bg-gradient-to-br from-yellow-400 to-orange-500 border-orange-600 text-white py-4 rounded-lg flex flex-col items-center gap-1 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div><span className="text-xl font-bold relative z-10">10 连抽</span><span className="text-xs bg-black/20 px-2 py-0.5 rounded text-white relative z-10">1000 G</span>
                        </button>
                    </div>
                </div>
                <button onClick={handleDevCheat} className="opacity-0 w-2 h-2 relative z-50 cursor-pointer bg-white"></button>
            </div>
            )}
            {view === 'battle' && battleState && (
            <BattleArena battleState={battleState} onAttack={executeTurn} onSwitch={handleSwitch} onRun={handleRun} onLeave={() => setBattleState(null)} zoneIndex={adventure.currentZoneIndex} />
            )}
            {view === 'adventure' && <AdventureView progress={adventure} inventory={inventory} knownCards={knownCards} awakening={awakening} onStartBattle={startBattle} selectedTeamIds={selectedTeamIds} onSelectCard={handleSelectCard} getStageEnemy={getStageEnemy} />}
            {view === 'pokedex' && <PokedexView knownCards={knownCards} inventory={inventory} />}
        </div>
      </main>

      {view !== 'battle' && (
          <nav className="bg-white border-t-4 border-slate-700 pt-2 px-2 flex justify-around items-end h-24 shrink-0 relative z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={() => { setView('inventory'); audioService.playSfx('CLICK'); }} className={`flex flex-col items-center pb-2 w-16 transition-transform duration-200 ${view === 'inventory' ? '-translate-y-4 scale-110' : 'opacity-60 hover:opacity-100 hover:-translate-y-1'}`}>
                <div className={`p-3 rounded-xl border-4 ${view === 'inventory' ? 'bg-blue-500 border-blue-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><Layers className="w-6 h-6" /></div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${view === 'inventory' ? 'text-blue-600' : 'text-slate-400'}`}>背包</span>
            </button>
            <button onClick={() => { setView('adventure'); audioService.playSfx('CLICK'); }} className={`flex flex-col items-center pb-2 w-16 transition-transform duration-200 ${view === 'adventure' ? '-translate-y-4 scale-110' : 'opacity-60 hover:opacity-100 hover:-translate-y-1'}`}>
                <div className={`p-3 rounded-xl border-4 ${view === 'adventure' ? 'bg-red-500 border-red-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><Compass className="w-6 h-6" /></div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${view === 'adventure' ? 'text-red-600' : 'text-slate-400'}`}>冒险</span>
            </button>
            <button onClick={() => { setView('gacha'); audioService.playSfx('CLICK'); }} className={`flex flex-col items-center pb-2 w-16 transition-transform duration-200 ${view === 'gacha' ? '-translate-y-4 scale-110' : 'opacity-60 hover:opacity-100 hover:-translate-y-1'}`}>
                <div className={`p-3 rounded-xl border-4 ${view === 'gacha' ? 'bg-purple-500 border-purple-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><Gift className="w-6 h-6" /></div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${view === 'gacha' ? 'text-purple-600' : 'text-slate-400'}`}>商店</span>
            </button>
            <button onClick={() => { setView('pokedex'); audioService.playSfx('CLICK'); }} className={`flex flex-col items-center pb-2 w-16 transition-transform duration-200 ${view === 'pokedex' ? '-translate-y-4 scale-110' : 'opacity-60 hover:opacity-100 hover:-translate-y-1'}`}>
                <div className={`p-3 rounded-xl border-4 ${view === 'pokedex' ? 'bg-yellow-500 border-yellow-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><BookOpen className="w-6 h-6" /></div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${view === 'pokedex' ? 'text-yellow-600' : 'text-slate-400'}`}>图鉴</span>
            </button>
          </nav>
      )}

      {showStarterModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center border-4 border-slate-800 retro-container">
            <Gift className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2 text-slate-800">大木博士的礼物!</h2>
            <p className="text-slate-600 mb-6">欢迎来到 PokeGen 世界！<br/>这是给新手的 10 连抽，必得御三家！</p>
            <button onClick={claimStarterPack} className="retro-btn w-full py-3 rounded text-lg font-bold bg-red-500 hover:bg-red-600 animate-pulse">领取礼物</button>
          </div>
        </div>
      )}

      {showDrawModal && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-900/95 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center p-4 text-white border-b border-slate-700">
             <h2 className="text-xl font-bold tracking-widest">!! GOTCHA !!</h2>
             <button onClick={() => setShowDrawModal(false)}><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 justify-items-center content-start">
             {drawnCards.map((item, idx) => {
                 const card = knownCards[item.cardId];
                 return <div key={idx} className="animate-pop-in" style={{ animationDelay: `${idx * 150}ms` }}><CardView data={card} rarity={item.rarity} isNew={item.isNew} /></div>;
             })}
          </div>
          <div className="p-4 border-t border-slate-700 bg-slate-800 flex gap-4 justify-center">
             <button onClick={() => handleBuyDraw(lastDrawAmount)} className="retro-btn bg-yellow-500 border-yellow-700 text-white px-6 py-3 rounded font-bold shadow-lg flex flex-col items-center leading-none"><span>再抽一次</span><span className="text-[10px] mt-1">{lastDrawAmount * 100} G</span></button>
             <button onClick={() => setShowDrawModal(false)} className="retro-btn bg-slate-600 border-slate-800 text-white px-8 py-3 rounded font-bold shadow-lg">关闭</button>
          </div>
        </div>
      )}

      {battleState && (battleState.status === BattleStatus.WON || battleState.status === BattleStatus.LOST) && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in">
              <div className={`retro-container p-8 rounded-lg max-w-xs w-full text-center border-4 shadow-2xl ${battleState.status === BattleStatus.WON ? 'bg-yellow-50 border-yellow-500' : 'bg-slate-100 border-slate-500'}`}>
                  {battleState.status === BattleStatus.WON ? (
                      <>
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-bold text-yellow-600 mb-2">战斗胜利!</h2>
                        <div className="flex items-center justify-center gap-2 text-xl font-mono font-bold text-slate-700 mb-6">
                            <span>获得</span>
                            <span className="flex items-center text-yellow-600 bg-yellow-100 px-3 py-1 rounded border border-yellow-300"><Wallet className="w-5 h-5 mr-2" /> {battleState.reward}</span>
                        </div>
                        {battleState.isBoss && <div className="bg-blue-100 text-blue-700 p-2 rounded text-sm font-bold mb-4 animate-pulse">🎉 新区域已解锁!</div>}
                      </>
                  ) : (
                      <>
                        <Skull className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-600 mb-2">战斗失败...</h2>
                        <p className="text-slate-500 mb-6">别气馁，提升实力再来挑战！</p>
                      </>
                  )}
                  <button onClick={() => { audioService.playSfx('CLICK'); setBattleState(null); setView('adventure'); audioService.playBgm('LOBBY'); }} className="retro-btn w-full py-3 text-lg font-bold bg-blue-600 rounded">确定</button>
              </div>
          </div>
      )}

      {notification.isOpen && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white border-4 border-slate-800 p-6 rounded shadow-2xl max-w-xs text-center retro-container">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-lg font-bold mb-6 text-slate-800 whitespace-pre-wrap">{notification.message}</p>
                  <div className="flex gap-4 justify-center">
                      {notification.type === 'confirm' && <button onClick={notification.onCancel} className="retro-btn bg-slate-500 px-4 py-2 rounded text-white font-bold">取消</button>}
                      <button onClick={notification.onConfirm} className="retro-btn bg-blue-600 px-6 py-2 rounded text-white font-bold">确定</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
