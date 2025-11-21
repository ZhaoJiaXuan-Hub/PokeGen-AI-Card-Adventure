
import React, { useMemo } from 'react';
import { AdventureProgress, CardData, Inventory, Rarity } from '../types';
import { ZONES, STAGES_PER_ZONE } from '../constants';
import { Map, Skull, Trophy, Sword, Heart, Star, CheckCircle, Zap, Lock, Users } from 'lucide-react';

interface AdventureViewProps {
  progress: AdventureProgress;
  inventory: Inventory;
  knownCards: Record<string, CardData>;
  awakening: Record<string, number>;
  onStartBattle: (type: 'adventure' | 'training') => void;
  selectedTeamIds: string[];
  onSelectCard: (key: string) => void;
  getStageEnemy: (zoneIdx: number, stage: number) => CardData;
}

export const AdventureView: React.FC<AdventureViewProps> = ({ progress, inventory, knownCards, awakening, onStartBattle, selectedTeamIds, onSelectCard, getStageEnemy }) => {
  
  // Prepare and sort team list
  const teamList = useMemo(() => {
      return (Object.entries(inventory) as [string, number][])
        .filter(([_, count]) => count > 0)
        .map(([key, count]) => {
            const [cardId, rarityStr] = key.split('_');
            const rarity = parseInt(rarityStr) as Rarity;
            const cardData = knownCards[cardId];
            return { key, cardId, rarity, count, cardData };
        })
        .filter(item => item.cardData)
        .sort((a, b) => {
            // Calculate power using new Formula + Awakening
            const aLevel = awakening[a.cardId] || 0;
            const bLevel = awakening[b.cardId] || 0;
            const aMult = (1 + ((a.rarity - 1) * 0.5)) * (1 + (aLevel * 0.2));
            const bMult = (1 + ((b.rarity - 1) * 0.5)) * (1 + (bLevel * 0.2));

            const powerA = (a.cardData!.attack * aMult) + (a.cardData!.hp * 12 * aMult);
            const powerB = (b.cardData!.attack * bMult) + (b.cardData!.hp * 12 * bMult);
            return powerB - powerA;
        });
  }, [inventory, knownCards, awakening]);

  // Auto-select if empty (just one) - Optional, maybe better to let user choose
  React.useEffect(() => {
    if (selectedTeamIds.length === 0 && teamList.length > 0) {
        onSelectCard(teamList[0].key);
    }
  }, [teamList, selectedTeamIds.length, onSelectCard]);

  const currentZone = ZONES[progress.currentZoneIndex];
  const isBossStage = progress.currentStage === STAGES_PER_ZONE;

  const handleBattleClick = (type: 'adventure' | 'training') => {
    if (selectedTeamIds.length === 0) {
        alert("请至少选择一只宝可梦！");
        return;
    }
    onStartBattle(type);
  };

  return (
    <div className="flex flex-col p-2 space-y-4 pb-32">
      
      {/* Map Header */}
      <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-4 text-white shadow-lg relative overflow-hidden shrink-0">
        <div className={`absolute inset-0 opacity-20 ${currentZone.color}`}></div>
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold tracking-wider flex items-center gap-2">
                    <Map className="w-6 h-6" />
                    {currentZone.name}
                </h2>
                <p className="text-slate-300 text-sm mt-1">{currentZone.description}</p>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-400 uppercase">区域</div>
                <div className="text-xl font-mono font-bold text-yellow-400">{progress.currentZoneIndex + 1}</div>
            </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="bg-white border-4 border-slate-700 rounded-lg p-4 shadow-md shrink-0">
        <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-slate-700">关卡进度</span>
            <span className="font-mono font-bold text-slate-900">{progress.currentStage} / {STAGES_PER_ZONE}</span>
        </div>
        <div className="flex gap-2 h-14 items-center justify-between px-2 mt-2">
            {Array.from({ length: STAGES_PER_ZONE }).map((_, i) => {
                const step = i + 1;
                const isCompleted = step < progress.currentStage;
                const isCurrent = step === progress.currentStage;
                const isFuture = step > progress.currentStage;
                const isBoss = step === STAGES_PER_ZONE;

                const enemy = getStageEnemy(progress.currentZoneIndex, step);
                const spriteUrl = enemy.imageUrl || `https://img.pokemondb.net/sprites/black-white/normal/${enemy.id}.png`;

                let borderClass = 'border-slate-300';
                if (isCompleted) borderClass = 'border-green-500';
                if (isCurrent) borderClass = 'border-blue-600 animate-pulse';
                if (isCurrent && isBoss) borderClass = 'border-red-600 animate-bounce';
                if (isFuture) borderClass = 'border-slate-400';

                return (
                    <div key={i} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && <div className={`absolute top-1/2 right-[50%] w-full h-1 -translate-y-1/2 -z-10 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}></div>}
                        
                        <div className={`
                            w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center z-10 transition-all overflow-hidden bg-white
                            ${borderClass}
                            ${isFuture ? 'grayscale opacity-60' : ''}
                        `}>
                            <img 
                                src={spriteUrl} 
                                alt={`Stage ${step}`} 
                                className={`w-full h-full object-contain pixelated ${isFuture ? 'contrast-0 brightness-0 opacity-30' : ''}`}
                            />
                            {isFuture && <Lock className="absolute w-4 h-4 text-slate-500" />}
                            {isCompleted && <CheckCircle className="absolute w-full h-full text-green-500/50 p-1" />}
                        </div>
                        
                        {isBoss && <div className="absolute -top-3"><Skull size={12} className="text-red-600"/></div>}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 shrink-0">
        <button 
            onClick={() => handleBattleClick('adventure')}
            className={`retro-btn py-4 rounded-lg flex flex-col items-center justify-center gap-1 ${isBossStage ? 'bg-red-600 border-red-800 hover:bg-red-500' : 'bg-blue-600 border-blue-800 hover:bg-blue-500'}`}
        >
            {isBossStage ? <Skull className="w-8 h-8 animate-pulse" /> : <Sword className="w-8 h-8" />}
            <span className="font-bold text-lg">{isBossStage ? '挑战 BOSS' : '继续冒险'}</span>
            <span className="text-xs opacity-80">推进关卡进度</span>
        </button>

        <button 
             onClick={() => handleBattleClick('training')}
            className="retro-btn bg-green-600 border-green-800 hover:bg-green-500 py-4 rounded-lg flex flex-col items-center justify-center gap-1"
        >
            <Trophy className="w-8 h-8" />
            <span className="font-bold text-lg">特训刷怪</span>
            <span className="text-xs opacity-80">仅获取金币</span>
        </button>
      </div>

      {/* Team Selection List View */}
      <div className="bg-[#f0f9ff] border-4 border-slate-300 rounded-lg p-2 flex flex-col min-h-[200px]">
        <div className="flex justify-between items-center mb-2 border-b-2 border-slate-200 pb-1 px-1">
             <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                编辑队伍 ({selectedTeamIds.length}/6)
             </div>
             <div className="text-xs text-blue-600 font-bold">
                点击选择/取消
             </div>
        </div>
        
        <div className="space-y-2 pr-1">
             {teamList.map((item) => {
                 const { key, cardData, rarity, count } = item;
                 if (!cardData) return null;
                 
                 // Check if this card is in selected list
                 const selectedIndex = selectedTeamIds.indexOf(key);
                 const isSelected = selectedIndex >= 0;
                 const awakeningLevel = awakening[cardData.id] || 0;
                 
                 // Consistent stats calculation
                 const rarityMult = 1 + ((rarity - 1) * 0.5);
                 const awakenMult = 1 + (awakeningLevel * 0.2);
                 const hp = Math.floor(cardData.hp * 12 * rarityMult * awakenMult);
                 const atk = Math.floor(cardData.attack * rarityMult * awakenMult);

                 return (
                     <div 
                        key={key} 
                        onClick={() => onSelectCard(key)}
                        className={`
                            flex items-center gap-3 p-2 rounded border-2 cursor-pointer transition-all select-none
                            ${isSelected 
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-slate-300 active:bg-slate-100'}
                        `}
                     >
                         {/* Selection Number Badge */}
                         <div className={`w-6 h-12 flex items-center justify-center font-bold ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                            {isSelected ? selectedIndex + 1 : <div className="w-3 h-3 rounded-full bg-slate-200"></div>}
                         </div>

                         {/* Avatar */}
                         <div className={`w-12 h-12 bg-slate-100 rounded border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 ${isSelected ? 'bg-white' : ''}`}>
                             <img 
                                src={cardData.imageUrl || `https://img.pokemondb.net/sprites/black-white/normal/${cardData.id}.png`} 
                                alt={cardData.name}
                                className="w-10 h-10 object-contain pixelated"
                             />
                         </div>
                         
                         {/* Info */}
                         <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-1">
                                 <span className="font-bold text-slate-800 truncate text-sm">{cardData.name}</span>
                                 {awakeningLevel > 0 && <span className="text-xs font-bold text-red-500 px-1 border border-red-200 rounded bg-red-50">+{awakeningLevel}</span>}
                                 <div className="flex text-yellow-500">
                                     {Array.from({length: rarity}).map((_, i) => <Star key={i} size={10} fill={awakeningLevel > 0 ? '#ef4444' : 'currentColor'} className={awakeningLevel > 0 ? 'text-red-500' : ''} />)}
                                 </div>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                 <span className="flex items-center gap-0.5 font-mono"><Heart size={10} className="text-red-500" /> {hp}</span>
                                 <span className="flex items-center gap-0.5 font-mono"><Sword size={10} className="text-blue-500" /> {atk}</span>
                                 <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 font-bold">{cardData.type}</span>
                             </div>
                         </div>

                         {/* Status */}
                         <div className="text-right shrink-0 flex flex-col items-end justify-center">
                             {awakeningLevel >= 1 && <Zap className="w-4 h-4 text-purple-500 mb-1" />}
                             <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 rounded-full">x{count}</span>
                             {isSelected && <CheckCircle className="w-5 h-5 text-blue-500 mt-1" />}
                         </div>
                     </div>
                 )
            })}
        </div>
      </div>

    </div>
  );
};
