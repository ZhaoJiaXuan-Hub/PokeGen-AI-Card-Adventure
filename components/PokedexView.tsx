
import React, { useMemo, useState } from 'react';
import { CardData, Inventory, Rarity } from '../types';
import { TYPE_CHART } from '../constants';
import { CardView } from './CardView';
import { BookOpen, Lock, Shield, Sword, X, Target, Info } from 'lucide-react';
import { audioService } from '../services/audioService';

interface PokedexViewProps {
  knownCards: Record<string, CardData>;
  inventory: Inventory;
}

export const PokedexView: React.FC<PokedexViewProps> = ({ knownCards, inventory }) => {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  const pokedexList = useMemo(() => {
    const list = (Object.values(knownCards) as CardData[]).map((card) => {
      // Check if we own at least one copy of any rarity
      const isOwned = Object.keys(inventory).some(key => key.startsWith(`${card.id}_`) && inventory[key] > 0);
      
      // Find highest rarity owned
      let maxRarity = 0;
      if (isOwned) {
          Object.keys(inventory).forEach(key => {
              if (key.startsWith(`${card.id}_`) && inventory[key] > 0) {
                  const r = parseInt(key.split('_')[1]);
                  if (r > maxRarity) maxRarity = r;
              }
          });
      }

      return {
        card,
        isOwned,
        maxRarity: maxRarity as Rarity || Rarity.COMMON
      };
    });

    return list.sort((a, b) => a.card.id.localeCompare(b.card.id));
  }, [knownCards, inventory]);

  const totalCount = pokedexList.length;
  const ownedCount = pokedexList.filter(i => i.isOwned).length;
  const progressPercent = Math.round((ownedCount / totalCount) * 100) || 0;

  const handleCardClick = (card: CardData, isOwned: boolean) => {
      if (!isOwned) return;
      audioService.playSfx('CLICK');
      setSelectedCard(card);
  };

  const getTypeEffectiveness = (type: string) => {
      // Weakness: Types that deal > 1x damage TO this type
      const weaknesses: string[] = [];
      Object.entries(TYPE_CHART).forEach(([atkType, multipliers]) => {
          if (multipliers[type] > 1) weaknesses.push(atkType);
      });

      // Strengths: Types that this type deals > 1x damage TO
      const strengths: string[] = [];
      const myMultipliers = TYPE_CHART[type] || {};
      Object.entries(myMultipliers).forEach(([defType, mult]) => {
          if (mult > 1) strengths.push(defType);
      });

      return { weaknesses, strengths };
  };

  return (
    <div className="p-4 pb-32 space-y-6">
      
      {/* Header Stats */}
      <div className="retro-container bg-red-600 border-red-800 p-4 text-white shadow-lg">
         <div className="flex justify-between items-end">
             <div>
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                     <BookOpen className="w-6 h-6" />
                     宝可梦图鉴
                 </h2>
                 <p className="text-red-100 text-sm opacity-90">记录所有发现的物种</p>
             </div>
             <div className="text-right">
                 <div className="text-3xl font-mono font-bold">{ownedCount} <span className="text-sm text-red-200">/ {totalCount}</span></div>
             </div>
         </div>
         
         <div className="mt-3 w-full h-4 bg-red-900 rounded-full border-2 border-red-950 overflow-hidden">
             <div 
                className="h-full bg-yellow-400 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
             ></div>
         </div>
         <div className="text-right text-[10px] mt-1 text-red-200 font-mono">收集度: {progressPercent}%</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 justify-items-center gap-4">
          {pokedexList.map(({ card, isOwned, maxRarity }) => (
              <div key={card.id} className="relative group cursor-pointer" onClick={() => handleCardClick(card, isOwned)}>
                  {isOwned ? (
                      <div className="transform transition hover:scale-105 active:scale-95">
                        <CardView 
                            data={card} 
                            rarity={maxRarity} 
                            showEnhance={false}
                        />
                      </div>
                  ) : (
                      <div className="w-44 h-64 retro-container bg-slate-300 border-slate-400 flex flex-col items-center justify-center relative opacity-80 grayscale">
                          <div className="absolute inset-0 bg-black/10 z-0"></div>
                          <div className="relative z-10 w-24 h-24 mb-4 opacity-30 contrast-200 brightness-0">
                             <img 
                                src={`https://img.pokemondb.net/sprites/black-white/normal/${card.id}.png`}
                                alt="???"
                                className="w-full h-full object-contain pixelated"
                             />
                          </div>
                          <div className="z-10 bg-slate-800 text-white px-3 py-1 rounded font-mono font-bold text-xl tracking-widest">
                              ???
                          </div>
                          <div className="absolute top-2 right-2 text-slate-500 z-10">
                              <Lock className="w-5 h-5" />
                          </div>
                          <div className="absolute bottom-4 text-xs text-slate-500 font-bold">
                              未发现
                          </div>
                      </div>
                  )}
              </div>
          ))}
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="retro-container bg-slate-100 border-slate-800 w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col relative no-scrollbar shadow-2xl">
                
                {/* Modal Header */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                         <Info className="w-5 h-5 text-blue-400" />
                         <span className="font-bold text-lg tracking-wider">数据分析终端</span>
                    </div>
                    <button 
                        onClick={() => setSelectedCard(null)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Top Section: Identity */}
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-white border-4 border-slate-300 rounded shadow-inner flex items-center justify-center shrink-0">
                            <img 
                                src={selectedCard.imageUrl || `https://img.pokemondb.net/sprites/black-white/normal/${selectedCard.id}.png`} 
                                className="w-20 h-20 object-contain pixelated"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h3 className="text-2xl font-bold text-slate-800">{selectedCard.name}</h3>
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded w-fit mt-1 font-mono font-bold">TYPE: {selectedCard.type}</span>
                            <p className="text-sm text-slate-500 mt-2 leading-tight">{selectedCard.description}</p>
                        </div>
                    </div>

                    {/* Stats Radar Simulation */}
                    <div className="bg-slate-200 p-3 rounded border-2 border-slate-300">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Base Stats</div>
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-xs mb-0.5 font-bold"><span>HP</span> <span>{selectedCard.hp}</span></div>
                                <div className="h-2 bg-slate-300 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{width: `${Math.min(100, (selectedCard.hp / 150) * 100)}%`}}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-0.5 font-bold"><span>ATK</span> <span>{selectedCard.attack}</span></div>
                                <div className="h-2 bg-slate-300 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width: `${Math.min(100, (selectedCard.attack / 150) * 100)}%`}}></div></div>
                            </div>
                        </div>
                    </div>

                    {/* Type Analysis */}
                    {(() => {
                        const { weaknesses, strengths } = getTypeEffectiveness(selectedCard.type);
                        return (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold border-b-2 border-slate-300 pb-1">
                                        <Sword className="w-4 h-4 text-red-500" />
                                        <span>进攻优势 (Strong Against)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {strengths.length > 0 ? strengths.map(t => (
                                            <span key={t} className="px-2 py-1 bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded shadow-sm">
                                                {t}
                                            </span>
                                        )) : <span className="text-xs text-slate-400 italic">无明显克制对象</span>}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold border-b-2 border-slate-300 pb-1">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        <span>防御弱点 (Weak To)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {weaknesses.length > 0 ? weaknesses.map(t => (
                                            <span key={t} className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded shadow-sm">
                                                {t}
                                            </span>
                                        )) : <span className="text-xs text-slate-400 italic">无明显弱点</span>}
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800 mt-2">
                                    <div className="font-bold flex items-center gap-1 mb-1"><Target size={12}/> AI 战术建议</div>
                                    {strengths.length > 0 
                                        ? `在对战 ${strengths.join('、')} 属性的敌人时，${selectedCard.name} 能造成巨额伤害。`
                                        : `${selectedCard.name} 输出能力平稳，适合持久战。`}
                                    {weaknesses.length > 0 && ` 遇到 ${weaknesses.join('、')} 属性的敌人请谨慎换人。`}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
