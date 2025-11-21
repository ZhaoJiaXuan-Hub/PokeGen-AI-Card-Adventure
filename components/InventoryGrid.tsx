

import React, { useMemo } from 'react';
import { CardView } from './CardView';
import { CardData, Inventory, Rarity } from '../types';
import { ArrowUpCircle, Zap } from 'lucide-react';

interface InventoryGridProps {
  inventory: Inventory;
  knownCards: Record<string, CardData>;
  awakening: Record<string, number>;
  onMerge: (cardId: string, rarity: Rarity) => void;
  onEnhanceArt: (cardId: string) => void;
  onAwaken: (cardId: string) => void;
  enhancingId: string | null;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ inventory, knownCards, awakening, onMerge, onEnhanceArt, onAwaken, enhancingId }) => {
  const cardsToDisplay = useMemo(() => {
    const items: { cardId: string; rarity: Rarity; count: number }[] = [];
    (Object.entries(inventory) as [string, number][]).forEach(([key, count]) => {
      if (count > 0) {
        const [cardId, rarityStr] = key.split('_');
        items.push({
          cardId,
          rarity: parseInt(rarityStr) as Rarity,
          count
        });
      }
    });
    
    return items.sort((a, b) => {
        if (b.rarity !== a.rarity) return b.rarity - a.rarity;
        if (b.count !== a.count) return b.count - a.count;
        return knownCards[a.cardId]?.name.localeCompare(knownCards[b.cardId]?.name) || 0;
    });
  }, [inventory, knownCards]);

  if (cardsToDisplay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono">
        <div className="bg-white p-8 border-4 border-slate-300 rounded-lg shadow-inner text-center">
          <p className="text-xl mb-2">箱子是空的</p>
          <p className="text-sm">去野外捕捉一些宝可梦吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-32">
      {/* PC Box Header Style */}
      <div className="bg-slate-700 text-white px-4 py-2 mb-4 border-b-4 border-slate-900 rounded-t-lg flex justify-between items-center">
         <span className="font-bold tracking-wider">电脑箱 1</span>
         <span className="text-xs text-slate-300">{cardsToDisplay.length} 宝可梦</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
        {cardsToDisplay.map((item) => {
          const cardData = knownCards[item.cardId];
          if (!cardData) return null;

          const isLegendary = item.rarity === Rarity.LEGENDARY;
          const awakeningLevel = awakening[item.cardId] || 0;

          const canMerge = item.count >= 3 && item.rarity < Rarity.LEGENDARY;
          // Can awaken if Legendary, have spare copy (need > 1 because we keep one base), and not maxed
          const canAwaken = isLegendary && item.count > 1 && awakeningLevel < 5;

          return (
            <div key={`${item.cardId}_${item.rarity}`} className="relative group">
              <CardView 
                data={cardData} 
                rarity={item.rarity} 
                count={item.count}
                showEnhance={true}
                onEnhance={() => onEnhanceArt(item.cardId)}
                isEnhancing={enhancingId === item.cardId}
                awakeningLevel={isLegendary ? awakeningLevel : 0}
              />
              
              {/* Merge Button */}
              {canMerge && (
                <button 
                  onClick={() => onMerge(item.cardId, item.rarity)}
                  className="absolute -top-4 -right-2 bg-green-500 hover:bg-green-400 text-white p-1.5 rounded border-2 border-black shadow-lg animate-bounce z-40"
                  title="合成 3 张升级"
                >
                  <ArrowUpCircle className="w-6 h-6" />
                </button>
              )}
              {canMerge && (
                 <div className="absolute -top-3 left-0 z-40 pointer-events-none">
                   <span className="bg-green-600 text-white text-[10px] px-2 py-1 rounded border-2 border-slate-800 shadow-md font-bold">
                     可升级!
                   </span>
                 </div>
              )}

              {/* Awakening Button */}
              {canAwaken && (
                <button 
                  onClick={() => onAwaken(item.cardId)}
                  className="absolute -top-4 -right-2 bg-purple-500 hover:bg-purple-400 text-white p-1.5 rounded border-2 border-black shadow-lg animate-pulse z-40"
                  title="界限突破"
                >
                  <Zap className="w-6 h-6 fill-yellow-300" />
                </button>
              )}
              {canAwaken && (
                 <div className="absolute -top-3 left-0 z-40 pointer-events-none">
                   <span className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded border-2 border-slate-800 shadow-md font-bold border-purple-300">
                     可突破!
                   </span>
                 </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};
