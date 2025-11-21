

import React, { useState, useEffect } from 'react';
import { Rarity, CardData } from '../types';
import { Sparkles, Flame, Droplets, Leaf, Zap, Ghost, Brain, Circle, Star } from 'lucide-react';

interface CardViewProps {
  data: CardData;
  rarity: Rarity;
  count?: number;
  onClick?: () => void;
  isNew?: boolean;
  showEnhance?: boolean;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  selected?: boolean;
  awakeningLevel?: number; // 0 to 5
}

const getTypeIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'fire' || t === '火') return <Flame className="w-4 h-4 text-red-600" />;
  if (t === 'water' || t === '水') return <Droplets className="w-4 h-4 text-blue-600" />;
  if (t === 'grass' || t === '草' || t === '虫') return <Leaf className="w-4 h-4 text-green-600" />;
  if (t === 'electric' || t === '电') return <Zap className="w-4 h-4 text-yellow-600" />;
  if (t === 'ghost' || t === '幽灵') return <Ghost className="w-4 h-4 text-purple-600" />;
  if (t === 'psychic' || t === '超能力') return <Brain className="w-4 h-4 text-pink-600" />;
  return <Circle className="w-4 h-4 text-gray-500" />;
};

// Using retro palette colors
const getRarityColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return 'bg-[#A8A878] border-[#705848]'; // Normal/Rock tones
    case Rarity.UNCOMMON: return 'bg-[#78C850] border-[#489030]'; // Grass tones
    case Rarity.RARE: return 'bg-[#6890F0] border-[#405090]'; // Water/Ice tones
    case Rarity.EPIC: return 'bg-[#A040A0] border-[#603060]'; // Poison/Ghost tones
    case Rarity.LEGENDARY: return 'bg-[#F8D030] border-[#B8A038]'; // Electric/Gold tones
    default: return 'bg-gray-400 border-gray-600';
  }
};

const getRarityName = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return '普通';
    case Rarity.UNCOMMON: return '罕见';
    case Rarity.RARE: return '稀有';
    case Rarity.EPIC: return '史诗';
    case Rarity.LEGENDARY: return '传说';
    default: return '';
  }
};

export const CardView: React.FC<CardViewProps> = ({ data, rarity, count, onClick, isNew, showEnhance, onEnhance, isEnhancing, selected, awakeningLevel = 0 }) => {
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [data.id, data.imageUrl]);

  const spriteUrl = `https://img.pokemondb.net/sprites/black-white/normal/${data.id}.png`;
  const fallbackUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${data.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  const imageSrc = data.imageUrl || (imgError ? fallbackUrl : spriteUrl);

  const isHolo = rarity >= Rarity.RARE;
  const isLegendary = rarity === Rarity.LEGENDARY;
  const isEpic = rarity === Rarity.EPIC;
  const isAwakened = awakeningLevel > 0;

  // Consistent stats calculation with App.tsx
  const rarityMult = 1 + ((rarity - 1) * 0.5);
  const awakenMult = 1 + (awakeningLevel * 0.2);
  const displayHp = Math.floor(data.hp * 12 * rarityMult * awakenMult);
  const displayAtk = Math.floor(data.attack * rarityMult * awakenMult);

  return (
    <div 
      onClick={onClick}
      className={`
        relative w-44 h-64 flex flex-col cursor-pointer transition-all duration-200 transform
        retro-card-frame
        ${getRarityColor(rarity)}
        group
        ${selected ? 'ring-4 ring-blue-500 scale-105' : 'hover:-translate-y-1'}
        ${isAwakened ? 'animate-rainbow' : (isEpic ? 'animate-glow-epic' : (isLegendary ? 'animate-glow-legendary' : ''))}
      `}
    >
      {/* Inner Border */}
      <div className="absolute inset-1 border-2 border-white/30 pointer-events-none z-20"></div>

      {/* Holo Overlay */}
      {isHolo && <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40 holo-bg z-20" />}
      {isLegendary && <div className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-50 sparkle-bg z-20" />}

      {/* Header */}
      <div className="flex justify-between items-center px-2 py-1 bg-white/90 border-b-2 border-black/10 z-10 mx-1 mt-1 rounded-t-sm">
        <div className="flex items-center truncate">
            <span className="text-sm font-bold text-slate-800 truncate">{data.name}</span>
            {isAwakened && <span className="text-xs font-bold text-red-600 ml-1">+{awakeningLevel}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs font-mono font-bold ${isAwakened ? 'text-purple-600' : 'text-red-600'}`}>{displayHp}</span>
          {getTypeIcon(data.type)}
        </div>
      </div>

      {/* Image Area */}
      <div className="relative flex-1 bg-white mx-1 border-2 border-[#e0e0e0] inset-shadow-md flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
        
        <img 
          src={imageSrc} 
          alt={data.name} 
          onError={() => setImgError(true)}
          className={`w-24 h-24 sm:w-28 sm:h-28 object-contain max-h-full pixelated relative z-10 transition-transform duration-500 ${isHolo ? 'group-hover:scale-110' : ''}`} 
        />
        
        {/* New Badge */}
        {isNew && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 border-2 border-white shadow-md z-30 animate-pulse">
            新
          </div>
        )}
         
         {/* Enhance Button */}
         {showEnhance && !data.imageUrl && (
           <button 
            onClick={(e) => {
              e.stopPropagation();
              onEnhance && onEnhance();
            }}
            disabled={isEnhancing}
            className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2 py-1 border-2 border-white shadow opacity-0 group-hover:opacity-100 transition-opacity z-30 disabled:bg-gray-400"
           >
             {isEnhancing ? '...' : 'AI图'}
           </button>
         )}
      </div>

      {/* Stats Area */}
      <div className="p-2 bg-[#F0F0E8] m-1 mt-0 border-t-0 rounded-b-sm z-10 flex flex-col h-26 justify-between">
        <div className="flex justify-between items-baseline border-b border-gray-400 pb-1 shrink-0">
          <span className="text-[10px] font-bold text-gray-600 uppercase">{getRarityName(rarity)}</span>
          <div className="flex items-center text-yellow-500 gap-0.5">
             {Array.from({ length: rarity }).map((_, i) => (
               <Star key={i} className={`w-2 h-2 ${isAwakened ? 'text-red-500 fill-red-500' : 'fill-current'}`} />
             ))}
          </div>
        </div>
        
        <p 
          className="text-[10px] text-gray-700 leading-tight line-clamp-5 font-medium mt-1 overflow-hidden"
          title={data.description}
        >
          {data.description}
        </p>
        
        <div className="mt-auto flex justify-between items-center pt-1 border-t border-gray-300 shrink-0">
          <div className="flex items-center gap-1">
             <span className={`text-xs font-bold ${isAwakened ? 'text-purple-700' : 'text-slate-800'}`}>⚔️ {displayAtk}</span>
          </div>
          {count !== undefined && (
            <span className="text-xs font-bold bg-slate-800 text-white px-1.5 rounded-sm">
              x{count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
