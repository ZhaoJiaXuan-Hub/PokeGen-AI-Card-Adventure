
import React, { useEffect, useRef, useState } from 'react';
import { BattleState, Rarity, SkillEffectType, HitMeta, BattleStatus, BattleCard } from '../types';
import { Sword, RotateCcw, Skull, Heart, Zap, ShieldOff, Lock, Star, RefreshCw, Footprints, X } from 'lucide-react';

interface BattleArenaProps {
  battleState: BattleState;
  onAttack: (skillIndex: number) => void;
  onSwitch: (newIndex: number) => void;
  onRun: () => void;
  onLeave: () => void;
}

// Floating Text Component
const FloatingText: React.FC<{ meta: HitMeta, target: 'player' | 'enemy' }> = ({ meta, target }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    let content = "";
    let colorClass = "";
    let animClass = "float-text";

    if (meta.type === 'DAMAGE') {
        content = `-${meta.value}`;
        colorClass = "text-white text-4xl";
        
        if (meta.isCrit) {
            content = `💥 暴击 ${content}`;
            colorClass = "text-orange-500 text-5xl";
            animClass = "crit-text";
        } else if (meta.isEffective) {
            content = `克制 ${content}`;
            colorClass = "text-yellow-400 text-5xl";
        }
    } else if (meta.type === 'HEAL') {
        content = `+${meta.value}`;
        colorClass = "text-green-400 text-4xl";
    } else {
        return null; 
    }

    const posStyle = target === 'player' 
        ? { bottom: '150px', left: '80px' }
        : { top: '120px', right: '80px' };

    return (
        <div className={`absolute z-50 pointer-events-none ${animClass} ${colorClass}`} style={posStyle}>
            {content}
        </div>
    );
};

export const BattleArena: React.FC<BattleArenaProps> = ({ battleState, onAttack, onSwitch, onRun, onLeave }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  
  const activePlayerCard = battleState.playerTeam[battleState.activeCardIndex];
  
  const [prevPlayerHp, setPrevPlayerHp] = useState(activePlayerCard.currentHp);
  const [prevEnemyHp, setPrevEnemyHp] = useState(battleState.enemyCard.currentHp);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);

  // VFX State
  const [activeVfx, setActiveVfx] = useState<{type: SkillEffectType, target: 'player' | 'enemy'} | null>(null);
  const [floats, setFloats] = useState<{id: number, meta: HitMeta, target: 'player' | 'enemy'}[]>([]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.logs]);

  // Auto-open switch modal if waiting for switch
  useEffect(() => {
      if (battleState.status === BattleStatus.WAITING_FOR_SWITCH) {
          setShowSwitchModal(true);
      }
  }, [battleState.status]);

  // Update PrevHP when active card changes so we don't trigger shake on switch
  useEffect(() => {
      setPrevPlayerHp(activePlayerCard.currentHp);
  }, [battleState.activeCardIndex]);

  // Handle Turn Updates
  useEffect(() => {
    if (battleState.lastPlayerAction) {
        const type = battleState.lastPlayerAction;
        const target = (type === 'DAMAGE' || type === 'DEBUFF_DEF') ? 'enemy' : 'player';
        setActiveVfx({ type, target });
        setTimeout(() => setActiveVfx(null), 600);
        if (battleState.playerResult) {
            setFloats(prev => [...prev, { id: Date.now(), meta: battleState.playerResult!, target }]);
        }
    }

    if (battleState.lastEnemyAction) {
        const type = battleState.lastEnemyAction;
        const target = (type === 'DAMAGE' || type === 'DEBUFF_DEF') ? 'player' : 'enemy';
        const timer = setTimeout(() => {
             setActiveVfx({ type, target });
             setTimeout(() => setActiveVfx(null), 600);
             if (battleState.enemyResult) {
                setFloats(prev => [...prev, { id: Date.now() + 1, meta: battleState.enemyResult!, target }]);
             }
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [battleState.turn, battleState.lastPlayerAction, battleState.lastEnemyAction]);


  useEffect(() => {
    // Only shake if it's the same card, or simple logic: if HP went down
    if (activePlayerCard.currentHp < prevPlayerHp) {
        setTimeout(() => {
             setShakePlayer(true);
             setTimeout(() => setShakePlayer(false), 500);
        }, 800);
    }
    setPrevPlayerHp(activePlayerCard.currentHp);

    if (battleState.enemyCard.currentHp < prevEnemyHp) {
        setShakeEnemy(true);
        setTimeout(() => setShakeEnemy(false), 500);
    }
    setPrevEnemyHp(battleState.enemyCard.currentHp);
  }, [activePlayerCard.currentHp, battleState.enemyCard.currentHp]);


  const getHealthPercent = (current: number, max: number) => Math.max(0, Math.min(100, (current / max) * 100));
  
  const getHealthColor = (percent: number) => {
    if (percent > 50) return 'bg-green-500';
    if (percent > 20) return 'bg-yellow-500';
    return 'bg-red-600';
  };

  const getSprite = (card: any) => {
    if (card.imageUrl) return card.imageUrl;
    return `https://img.pokemondb.net/sprites/black-white/normal/${card.id}.png`;
  };

  const getSkillIcon = (type: string) => {
      switch (type) {
          case 'DAMAGE': return <Sword className="w-4 h-4" />;
          case 'HEAL': return <Heart className="w-4 h-4" />;
          case 'BUFF_ATK': return <Zap className="w-4 h-4" />;
          case 'DEBUFF_DEF': return <ShieldOff className="w-4 h-4" />;
          default: return <Sword className="w-4 h-4" />;
      }
  };

  const renderBuffs = (buffs: any[]) => {
      return buffs.map((b, i) => {
          let icon = null;
          let color = '';
          let text = '';
          if (b.type === 'BUFF_ATK') {
              icon = <Zap size={10} />;
              color = 'text-green-600 bg-green-100 border-green-300';
              text = `+${Math.round(b.value * 100)}%`;
          } else if (b.type === 'DEBUFF_DEF') {
              icon = <ShieldOff size={10} />;
              color = 'text-red-600 bg-red-100 border-red-300';
              text = `-${Math.round(b.value * 100)}%`;
          }
          return (
              <div key={i} className={`flex items-center gap-0.5 px-1 rounded border text-[9px] font-bold ${color}`}>
                  {icon} {text}
              </div>
          );
      });
  };

  const renderVfx = () => {
      if (!activeVfx) return null;
      let posClass = '';
      if (activeVfx.target === 'player') posClass = 'bottom-24 left-8 sm:left-20'; 
      if (activeVfx.target === 'enemy') posClass = 'top-20 right-8 sm:right-24'; 

      let animClass = '';
      if (activeVfx.type === 'DAMAGE') animClass = 'vfx-slash';
      else if (activeVfx.type === 'HEAL') animClass = 'vfx-heal text-green-400 font-bold text-xl';
      else if (activeVfx.type === 'BUFF_ATK') animClass = 'vfx-buff text-yellow-400 font-bold text-xl';
      else if (activeVfx.type === 'DEBUFF_DEF') animClass = 'vfx-debuff text-purple-400 font-bold text-xl';

      let content = null;
      if (activeVfx.type === 'HEAL') content = '✚✚✚';
      if (activeVfx.type === 'BUFF_ATK') content = '▲UP▲';
      if (activeVfx.type === 'DEBUFF_DEF') content = '▼DOWN▼';

      return (
          <div className={`absolute ${posClass} z-50 pointer-events-none`}>
              <div className={animClass}>{content}</div>
          </div>
      );
  };

  const renderRarityStars = (rarity: Rarity, awakeningLevel: number) => {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: rarity }).map((_, i) => (
                <Star key={i} size={8} className={`${awakeningLevel > 0 ? 'text-red-500 fill-red-500' : 'text-yellow-500 fill-yellow-500'}`} />
            ))}
            {awakeningLevel > 0 && <span className="text-[10px] font-bold text-red-500 ml-0.5">+{awakeningLevel}</span>}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 relative overflow-hidden">
      {/* --- TOP SECTION: VISUAL ARENA --- */}
      <div className="relative flex-1 bg-[#f8f8f8] overflow-hidden">
        
        {/* Backgrounds... */}
        <div className={`absolute inset-0 z-0 ${battleState.isBoss ? 'bg-gradient-to-b from-red-900 to-slate-900' : 'bg-gradient-to-b from-blue-100 to-blue-200'}`}></div>
        {battleState.isBoss && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 z-0"></div>}
        <div className={`absolute bottom-0 w-full h-1/2 transform skew-y-[-3deg] origin-bottom-right z-0 border-t-4 ${battleState.isBoss ? 'bg-[#4a0404] border-red-500' : 'bg-[#d4d4d4] border-slate-300/50'}`}></div>
        
        {battleState.isBoss && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-20"><Skull className="w-64 h-64 text-red-900 animate-pulse" /></div>}

        {renderVfx()}
        {floats.map(f => <FloatingText key={f.id} meta={f.meta} target={f.target} />)}

        {/* --- ENEMY --- */}
        <div className="absolute top-4 left-2 z-20">
            <div className="bg-[#f8f8f0]/90 border-2 border-slate-700 rounded-md p-2 shadow-md min-w-[130px] max-w-[160px]">
                <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-bold text-xs truncate mr-1 ${battleState.isBoss ? 'text-red-600' : 'text-slate-800'}`}>
                        {battleState.isBoss && <Skull className="w-3 h-3 inline mr-1"/>}{battleState.enemyCard.name}
                    </span>
                    {renderRarityStars(battleState.enemyCard.rarity, battleState.enemyCard.awakeningLevel)}
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full border border-slate-400 overflow-hidden relative">
                    <div className={`h-full transition-all duration-500 ${getHealthColor(getHealthPercent(battleState.enemyCard.currentHp, battleState.enemyCard.maxHp))}`} style={{ width: `${getHealthPercent(battleState.enemyCard.currentHp, battleState.enemyCard.maxHp)}%` }}></div>
                </div>
                 <div className="flex flex-wrap gap-1 mt-1 min-h-[12px]">{renderBuffs(battleState.enemyBuffs)}</div>
            </div>
        </div>

        <div className={`absolute top-16 right-4 z-10 flex flex-col items-center transition-transform duration-100 ${shakeEnemy ? 'translate-x-2' : ''}`}>
            <img 
                src={getSprite(battleState.enemyCard)} alt="Enemy" 
                className={`object-contain pixelated relative ${battleState.isBoss ? 'w-32 h-32 sm:w-48 sm:h-48 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'w-24 h-24 sm:w-32 sm:h-32'} ${battleState.status === BattleStatus.WON ? 'animate-ping opacity-0' : 'animate-bounce-slow'} ${shakeEnemy ? 'opacity-50 mix-blend-multiply' : ''}`} 
            />
            <div className="w-20 h-3 bg-black/20 rounded-[50%] blur-sm -mt-1"></div>
        </div>


        {/* --- PLAYER --- */}
        <div className={`absolute bottom-2 left-4 z-10 flex flex-col items-center transition-transform duration-100 ${shakePlayer ? '-translate-x-2' : ''}`}>
            <img 
                src={getSprite(activePlayerCard)} alt="Player" 
                className={`w-28 h-28 sm:w-40 sm:h-40 object-contain pixelated scale-x-[-1] ${battleState.status === BattleStatus.LOST ? 'grayscale opacity-50' : ''} ${shakePlayer ? 'opacity-50 mix-blend-multiply' : ''} ${battleState.status === BattleStatus.RUNNING ? 'run-escape' : ''}`} 
            />
            <div className="w-24 h-4 bg-black/20 rounded-[50%] blur-sm -mt-2"></div>
        </div>

        {/* Player HUD - Bottom Right */}
        <div className="absolute bottom-8 right-2 z-20">
            {/* Team Status Balls */}
            <div className="flex justify-end gap-1 mb-1">
                {battleState.playerTeam.map((member, idx) => {
                    let colorClass = "bg-slate-400 border-slate-500";
                    if (member.currentHp > 0) colorClass = "bg-red-500 border-red-700"; // Alive
                    if (member.currentHp <= 0) colorClass = "bg-slate-700 border-slate-800 opacity-50"; // Fainted
                    if (idx === battleState.activeCardIndex) colorClass += " ring-2 ring-yellow-400";

                    return (
                         <div key={idx} className={`w-3 h-3 rounded-full border-2 ${colorClass} shadow-sm`} />
                    );
                })}
            </div>

            <div className="bg-[#f8f8f0]/90 border-2 border-slate-700 rounded-md p-2 shadow-md min-w-[140px] max-w-[180px]">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-slate-800 text-xs truncate mr-1">{activePlayerCard.name}</span>
                    {renderRarityStars(activePlayerCard.rarity, activePlayerCard.awakeningLevel)}
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full border border-slate-400 overflow-hidden mb-1">
                    <div className={`h-full transition-all duration-500 ${getHealthColor(getHealthPercent(activePlayerCard.currentHp, activePlayerCard.maxHp))}`} style={{ width: `${getHealthPercent(activePlayerCard.currentHp, activePlayerCard.maxHp)}%` }}></div>
                </div>
                <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-1 min-h-[12px]">{renderBuffs(battleState.playerBuffs)}</div>
                    <div className="text-right text-[10px] font-bold text-slate-600 font-mono ml-2">
                        {activePlayerCard.currentHp}/{activePlayerCard.maxHp}
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* --- BOTTOM SECTION: CONSOLE --- */}
      <div className="h-[200px] bg-[#222] border-t-4 border-[#444] p-3 flex flex-col gap-2 shrink-0 z-30">
        
        {/* Log Area */}
        <div className="flex-1 bg-[#333] border-2 border-[#555] rounded p-2 font-mono text-xs text-white overflow-y-auto shadow-inner">
            {battleState.logs.map((log, i) => (
                <div key={i} className="mb-1 text-slate-300 leading-tight">
                    <span className="text-yellow-500 mr-1">{'>'}</span>{log}
                </div>
            ))}
            <div ref={logEndRef} />
        </div>

        {/* Controls */}
        {(battleState.status === BattleStatus.WON || battleState.status === BattleStatus.LOST) ? (
             <div className="h-16 flex">
                 <button 
                    onClick={onLeave} 
                    className={`flex-1 font-bold text-sm border-b-4 active:border-b-0 active:translate-y-1 rounded flex items-center justify-center gap-2 uppercase tracking-wider
                    ${battleState.status === BattleStatus.WON 
                        ? 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500' 
                        : 'bg-gray-600 border-gray-800 text-white hover:bg-gray-500'}`}
                 >
                     <RotateCcw className="w-4 h-4" />
                     {battleState.status === BattleStatus.WON ? '胜利! 继续' : '战败... 返回'}
                 </button>
             </div>
         ) : (
            <div className="h-20 flex gap-2">
                 {/* Skill Buttons */}
                 <div className="flex-1 grid grid-cols-3 gap-2">
                    {activePlayerCard.skills.map((skill, idx) => {
                        let isLocked = false;
                        if (idx === 1 && activePlayerCard.rarity < Rarity.UNCOMMON) isLocked = true;
                        if (idx === 2 && activePlayerCard.rarity < Rarity.EPIC) isLocked = true;
                        
                        const cd = battleState.playerCooldowns[idx];
                        const onCooldown = cd > 0;
                        
                        let bgClass = 'bg-slate-600 border-slate-800'; 
                        if (!isLocked && !onCooldown) {
                            if (skill.type === 'DAMAGE') bgClass = 'bg-red-600 border-red-800 hover:bg-red-500';
                            else if (skill.type === 'HEAL') bgClass = 'bg-green-600 border-green-800 hover:bg-green-500';
                            else bgClass = 'bg-yellow-600 border-yellow-800 hover:bg-yellow-500';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => onAttack(idx)}
                                disabled={isLocked || onCooldown || !battleState.isPlayerTurn || battleState.status !== BattleStatus.ACTIVE}
                                className={`
                                    relative flex flex-col items-center justify-center p-1 rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all
                                    ${bgClass}
                                    disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:cursor-not-allowed
                                `}
                            >
                                {isLocked ? (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <Lock className="w-3 h-3 mb-1" /><span className="text-[9px] font-bold">未解锁</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            {getSkillIcon(skill.type)}
                                            <span className="font-bold text-white text-[10px] sm:text-xs truncate max-w-[50px]">{skill.name}</span>
                                        </div>
                                        {onCooldown && <span className="text-xs font-bold text-slate-300">CD {cd}</span>}
                                    </>
                                )}
                            </button>
                        );
                    })}
                 </div>

                 {/* Side Buttons */}
                 <div className="w-20 flex flex-col gap-2">
                    <button 
                        onClick={() => setShowSwitchModal(true)}
                        disabled={!battleState.isPlayerTurn || battleState.status !== BattleStatus.ACTIVE}
                        className="flex-1 bg-indigo-600 border-indigo-800 border-b-4 active:border-b-0 active:translate-y-1 text-white rounded flex items-center justify-center disabled:opacity-50 disabled:active:translate-y-0"
                        title="更换宝可梦"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onRun}
                        disabled={!battleState.isPlayerTurn || battleState.status !== BattleStatus.ACTIVE || battleState.isBoss}
                        className="flex-1 bg-slate-600 border-slate-800 border-b-4 active:border-b-0 active:translate-y-1 text-white rounded flex items-center justify-center disabled:opacity-50 disabled:active:translate-y-0"
                        title="逃跑"
                    >
                        <Footprints className="w-5 h-5" />
                    </button>
                 </div>
            </div>
         )}
      </div>

      {/* Switch Modal */}
      {showSwitchModal && (
          <div className="absolute inset-0 bg-black/80 z-50 flex flex-col p-4 animate-in fade-in">
              <div className="flex justify-between items-center text-white mb-4 border-b border-slate-600 pb-2">
                  <h3 className="text-xl font-bold">选择出战宝可梦</h3>
                  {battleState.status !== BattleStatus.WAITING_FOR_SWITCH && (
                      <button onClick={() => setShowSwitchModal(false)}><X /></button>
                  )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                  {battleState.playerTeam.map((pokemon, idx) => {
                      const isAlive = pokemon.currentHp > 0;
                      const isActive = idx === battleState.activeCardIndex;
                      
                      return (
                          <button 
                            key={idx}
                            onClick={() => {
                                if (isAlive && !isActive) {
                                    onSwitch(idx);
                                    setShowSwitchModal(false);
                                }
                            }}
                            disabled={!isAlive || isActive}
                            className={`w-full flex items-center p-2 rounded border-2 
                                ${isActive ? 'bg-green-900/50 border-green-500' : 'bg-slate-800 border-slate-600'}
                                ${isAlive && !isActive ? 'hover:bg-slate-700 hover:border-slate-400 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                            `}
                          >
                              <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center mr-3">
                                   <img src={getSprite(pokemon)} className={`w-8 h-8 pixelated ${isAlive ? '' : 'grayscale'}`} />
                              </div>
                              <div className="text-left flex-1">
                                  <div className="flex items-center gap-2">
                                      <span className={`font-bold ${isAlive ? 'text-white' : 'text-red-400 line-through'}`}>{pokemon.name}</span>
                                      {isActive && <span className="text-xs bg-green-600 text-white px-1 rounded">当前</span>}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                      HP: {pokemon.currentHp}/{pokemon.maxHp}
                                  </div>
                              </div>
                          </button>
                      );
                  })}
              </div>
              
              {battleState.status === BattleStatus.WAITING_FOR_SWITCH && (
                  <div className="mt-4 text-center text-red-400 text-sm font-bold animate-pulse">
                      当前宝可梦已倒下，请选择下一个！
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
