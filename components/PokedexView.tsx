
import React, { useMemo } from 'react';
import { CardData, Inventory, Rarity } from '../types';
import { CardView } from './CardView';
import { BookOpen, Lock } from 'lucide-react';

interface PokedexViewProps {
  knownCards: Record<string, CardData>;
  inventory: Inventory;
}

export const PokedexView: React.FC<PokedexViewProps> = ({ knownCards, inventory }) => {
  
  const pokedexList = useMemo(() => {
    const list = (Object.values(knownCards) as CardData[]).map((card) => {
      // Check if we own at least one copy of any rarity
      const isOwned = Object.keys(inventory).some(key => key.startsWith(`${card.id}_`) && inventory[key] > 0);
      
      // Find highest rarity owned (for display flair, optional)
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

    // Sort by ID to keep the Pokedex order stable
    return list.sort((a, b) => a.card.id.localeCompare(b.card.id));
  }, [knownCards, inventory]);

  const totalCount = pokedexList.length;
  const ownedCount = pokedexList.filter(i => i.isOwned).length;
  const progressPercent = Math.round((ownedCount / totalCount) * 100) || 0;

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
         
         {/* Progress Bar */}
         <div className="mt-3 w-full h-4 bg-red-900 rounded-full border-2 border-red-950 overflow-hidden">
             <div 
                className="h-full bg-yellow-400 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
             ></div>
         </div>
         <div className="text-right text-[10px] mt-1 text-red-200 font-mono">收集度: {progressPercent}%</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 justify-items-center gap-6">
          {pokedexList.map(({ card, isOwned, maxRarity }) => (
              <div key={card.id} className="relative group">
                  {isOwned ? (
                      // Owned State
                      <div className="transform transition hover:scale-105">
                        <CardView 
                            data={card} 
                            rarity={maxRarity} 
                            // We don't show count here, just the card entry
                            showEnhance={false}
                        />
                      </div>
                  ) : (
                      // Unowned / Unknown State
                      <div className="w-44 h-64 retro-container bg-slate-300 border-slate-400 flex flex-col items-center justify-center relative opacity-80 grayscale">
                          <div className="absolute inset-0 bg-black/10 z-0"></div>
                          
                          {/* Silhouette Image */}
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
    </div>
  );
};
