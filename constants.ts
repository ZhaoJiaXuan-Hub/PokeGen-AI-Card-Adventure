
import { CardData, ZoneData, Rarity, Skill } from './types';

export const INITIAL_TOKENS = 0; // Start with 0, forced to claim starter pack
export const SCOUT_COST = 100; // Reduced to 100
export const ENHANCE_ART_COST = 500;
export const BATTLE_REWARD_BASE = 100; // Increased base reward

export const STAGES_PER_ZONE = 5;
export const STARTER_PACK_SIZE = 10;

// Defines the initial subset of cards the player knows at the start
export const STARTER_DEX_IDS = ['charmander', 'squirtle', 'bulbasaur', 'pidgey', 'rattata'];

// A large static database of Pokemon to serve as the pool for scouting
export const MASTER_CARDS: CardData[] = [
  // --- Starters ---
  { id: 'charmander', name: '小火龙', type: '火', hp: 45, attack: 52, description: '尾巴上的火焰代表着它的生命力。' },
  { id: 'charmeleon', name: '火恐龙', type: '火', hp: 65, attack: 70, description: '挥舞着燃烧的尾巴，撕裂敌人。' },
  { id: 'charizard', name: '喷火龙', type: '火', hp: 120, attack: 84, description: '能够喷出猛烈的火焰，甚至能熔化岩石。' },
  
  { id: 'squirtle', name: '杰尼龟', type: '水', hp: 44, attack: 48, description: '遇到危险时会缩进壳里保护自己。' },
  { id: 'wartortle', name: '卡咪龟', type: '水', hp: 60, attack: 65, description: '被视为长寿的象征。' },
  { id: 'blastoise', name: '水箭龟', type: '水', hp: 130, attack: 80, description: '甲壳上的大炮里喷出的水流非常强劲。' },

  { id: 'bulbasaur', name: '妙蛙种子', type: '草', hp: 45, attack: 49, description: '背上的种子沐浴阳光后会成长。' },
  { id: 'ivysaur', name: '妙蛙草', type: '草', hp: 60, attack: 62, description: '背上的花蕾在吸收养分后会盛开。' },
  { id: 'venusaur', name: '妙蛙花', type: '草', hp: 140, attack: 78, description: '背上有一朵巨大的花。' },

  // --- Common / Early Route ---
  { id: 'pidgey', name: '波波', type: '一般', hp: 40, attack: 45, description: '性情温和，不喜欢战斗。' },
  { id: 'pidgeotto', name: '比比鸟', type: '一般', hp: 63, attack: 60, description: '会飞在空中巡视自己的领地。' },
  { id: 'pidgeot', name: '大比鸟', type: '一般', hp: 83, attack: 80, description: '以２马赫的速度飞在天空中。' },
  { id: 'rattata', name: '小拉达', type: '一般', hp: 30, attack: 56, description: '牙齿很长，什么都能咬碎。' },
  { id: 'raticate', name: '拉达', type: '一般', hp: 55, attack: 81, description: '坚硬的牙齿甚至能咬断水泥。' },
  { id: 'pikachu', name: '皮卡丘', type: '电', hp: 60, attack: 55, description: '脸颊两边有小小的电力袋。' },
  { id: 'raichu', name: '雷丘', type: '电', hp: 90, attack: 90, description: '电击甚至能击倒印度象。' },
  { id: 'caterpie', name: '绿毛虫', type: '虫', hp: 45, attack: 30, description: '为了快点成长，会贪婪地吃着树叶。' },
  { id: 'metapod', name: '铁甲蛹', type: '虫', hp: 50, attack: 20, description: '正在为进化做准备，身体很硬。' },
  { id: 'butterfree', name: '巴大蝶', type: '虫', hp: 80, attack: 60, description: '翅膀上覆盖着有毒的磷粉。' },
  { id: 'weedle', name: '独角虫', type: '虫', hp: 40, attack: 35, description: '头顶的毒针非常危险。' },
  { id: 'kakuna', name: '铁壳蛹', type: '虫', hp: 45, attack: 25, description: '几乎一动不动，等待进化。' },
  { id: 'beedrill', name: '大针蜂', type: '虫', hp: 65, attack: 90, description: '成群结队地用毒针攻击敌人。' },

  // --- Zone Specific Minions/Bosses ---
  { id: 'geodude', name: '小拳石', type: '岩石', hp: 60, attack: 65, description: '看起来就像普通的石头。' },
  { id: 'graveler', name: '隆隆石', type: '岩石', hp: 80, attack: 80, description: '从山上滚下来移动。' },
  { id: 'golem', name: '隆隆岩', type: '岩石', hp: 110, attack: 110, description: '身体坚硬如磐石，不怕爆炸。' },
  { id: 'onix', name: '大岩蛇', type: '岩石', hp: 100, attack: 50, description: '在地下挖掘前进，会引起地震。' },
  
  { id: 'machop', name: '腕力', type: '格斗', hp: 70, attack: 80, description: '拥有举起隆隆岩的力气。' },
  { id: 'machoke', name: '豪力', type: '格斗', hp: 90, attack: 100, description: '肌肉发达，不知疲倦。' },
  { id: 'machamp', name: '怪力', type: '格斗', hp: 110, attack: 130, description: '四只手发出的拳击让人无法招架。' },

  { id: 'zubat', name: '超音蝠', type: '毒', hp: 40, attack: 45, description: '没有眼睛，靠超声波探测周围。' },
  { id: 'golbat', name: '大嘴蝠', type: '毒', hp: 75, attack: 80, description: '一张大嘴能吸干猎物的血液。' },

  { id: 'abra', name: '凯西', type: '超能力', hp: 25, attack: 20, description: '一天要睡18个小时。' },
  { id: 'kadabra', name: '勇基拉', type: '超能力', hp: 40, attack: 35, description: '也就是所谓的超能力少年。' },
  { id: 'alakazam', name: '胡地', type: '超能力', hp: 55, attack: 50, description: '智商高达5000的超级大脑。' },

  { id: 'gastly', name: '鬼斯', type: '幽灵', hp: 30, attack: 35, description: '几乎看不见的瓦斯状生命体。' },
  { id: 'haunter', name: '鬼斯通', type: '幽灵', hp: 45, attack: 50, description: '喜欢舔人吸取生命力。' },
  { id: 'gengar', name: '耿鬼', type: '幽灵', hp: 90, attack: 95, description: '满月的夜晚，影子自己动起来。' },

  { id: 'magnemite', name: '小磁怪', type: '电', hp: 30, attack: 40, description: '左右两边的部件能发出电磁波。' },
  { id: 'magneton', name: '三合一磁怪', type: '电', hp: 60, attack: 80, description: '三只小磁怪连接在一起。' },

  { id: 'poliwag', name: '蚊香蝌蚪', type: '水', hp: 40, attack: 50, description: '肚子上的漩涡是透明的内脏。' },
  { id: 'poliwhirl', name: '蚊香君', type: '水', hp: 65, attack: 65, description: '皮肤湿润光滑。' },
  { id: 'poliwrath', name: '蚊香泳士', type: '格斗', hp: 90, attack: 95, description: '擅长游泳，也擅长格斗。' },

  { id: 'magikarp', name: '鲤鱼王', type: '水', hp: 20, attack: 10, description: '世界上最弱最可怜的宝可梦。' },
  { id: 'gyarados', name: '暴鲤龙', type: '水', hp: 120, attack: 125, description: '非常凶暴的宝可梦，会破坏一切。' },

  { id: 'eevee', name: '伊布', type: '一般', hp: 55, attack: 55, description: '基因很不稳定，容易受环境影响。' },
  { id: 'vaporeon', name: '水伊布', type: '水', hp: 130, attack: 65, description: '身体细胞结构与水分子相似。' },
  { id: 'jolteon', name: '雷伊布', type: '电', hp: 65, attack: 110, description: '愤怒时全身毛发会像针一样竖起。' },
  { id: 'flareon', name: '火伊布', type: '火', hp: 65, attack: 130, description: '体内的火袋能产生1700度的高温。' },

  { id: 'dratini', name: '迷你龙', type: '龙', hp: 41, attack: 64, description: '很长时间里都被认为是幻之宝可梦。' },
  { id: 'dragonair', name: '哈克龙', type: '龙', hp: 61, attack: 84, description: '身上散发着神圣的气场。' },
  { id: 'dragonite', name: '快龙', type: '龙', hp: 130, attack: 134, description: '大约16小时就能绕地球一周。' },

  { id: 'snorlax', name: '卡比兽', type: '一般', hp: 160, attack: 110, description: '不吃不睡，不睡不吃。' },
  
  // --- Legendaries ---
  { id: 'articuno', name: '急冻鸟', type: '冰', hp: 90, attack: 85, description: '传说中的鸟宝可梦，能冻结空气。' },
  { id: 'zapdos', name: '闪电鸟', type: '电', hp: 90, attack: 90, description: '传说中的鸟宝可梦，能操控雷电。' },
  { id: 'moltres', name: '火焰鸟', type: '火', hp: 90, attack: 100, description: '传说中的鸟宝可梦，振翅会洒落火星。' },
  { id: 'mewtwo', name: '超梦', type: '超能力', hp: 150, attack: 154, description: '恐怖遗传基因研究实验所创造出来的宝可梦。' },
  { id: 'mew', name: '梦幻', type: '超能力', hp: 100, attack: 100, description: '拥有所有宝可梦的基因。' },
];

// For initialization purposes, create a map
export const INITIAL_CARDS: CardData[] = MASTER_CARDS.filter(c => STARTER_DEX_IDS.includes(c.id));

export const ZONES: ZoneData[] = [
  { 
    name: '真新镇郊外', 
    description: '冒险开始的地方，栖息着温顺的宝可梦。', 
    color: 'bg-green-500', 
    bossRarityMin: Rarity.COMMON,
    allowedTypes: ['一般', '飞行'],
    bossId: 'pidgeot'
  },
  { 
    name: '常磐森林', 
    description: '阴暗潮湿的森林，是虫系宝可梦的乐园。', 
    color: 'bg-green-700', 
    bossRarityMin: Rarity.UNCOMMON,
    allowedTypes: ['虫', '草', '毒'],
    bossId: 'beedrill'
  },
  { 
    name: '月见山', 
    description: '神秘的洞窟，据说有月之石落下。', 
    color: 'bg-slate-600', 
    bossRarityMin: Rarity.UNCOMMON,
    allowedTypes: ['岩石', '一般', '毒', '格斗'],
    bossId: 'golem'
  },
  { 
    name: '华蓝洞窟', 
    description: '水路复杂的洞穴，需要潜水才能前进。', 
    color: 'bg-blue-500', 
    bossRarityMin: Rarity.RARE,
    allowedTypes: ['水', '超能力', '冰'],
    bossId: 'blastoise'
  },
  { 
    name: '岩山隧道', 
    description: '漆黑的隧道，需要闪光术才能看清。', 
    color: 'bg-amber-700', 
    bossRarityMin: Rarity.RARE,
    allowedTypes: ['岩石', '地面', '格斗'],
    bossId: 'onix'
  },
  { 
    name: '宝可梦塔', 
    description: '紫苑镇的灵魂安息之地，幽灵出没。', 
    color: 'bg-purple-700', 
    bossRarityMin: Rarity.RARE,
    allowedTypes: ['幽灵', '毒', '超能力'],
    bossId: 'gengar'
  },
  { 
    name: '狩猎地带', 
    description: '拥有稀有宝可梦的自然保护区。', 
    color: 'bg-lime-600', 
    bossRarityMin: Rarity.EPIC,
    allowedTypes: ['一般', '草', '水', '龙'],
    bossId: 'dragonite'
  },
  { 
    name: '双子岛', 
    description: '被冰雪覆盖的双子岛屿，寒气逼人。', 
    color: 'bg-cyan-600', 
    bossRarityMin: Rarity.EPIC,
    allowedTypes: ['冰', '水', '超能力'],
    bossId: 'articuno'
  },
  { 
    name: '无人发电厂', 
    description: '被废弃的发电厂，积蓄着狂暴的电力。', 
    color: 'bg-yellow-600', 
    bossRarityMin: Rarity.LEGENDARY,
    allowedTypes: ['电', '钢', '毒'],
    bossId: 'zapdos'
  },
  { 
    name: '冠军之路', 
    description: '通往石英高原的最后试炼，强敌环伺。', 
    color: 'bg-indigo-800', 
    bossRarityMin: Rarity.LEGENDARY,
    allowedTypes: ['火', '龙', '超能力', '格斗', '岩石'],
    bossId: 'mewtwo'
  },
];

export const TYPE_CHART: Record<string, Record<string, number>> = {
  '火': { '草': 2.0, '冰': 2.0, '虫': 2.0, '钢': 2.0, '水': 0.5, '火': 0.5, '岩石': 0.5, '龙': 0.5 },
  '水': { '火': 2.0, '地面': 2.0, '岩石': 2.0, '草': 0.5, '水': 0.5, '龙': 0.5 },
  '草': { '水': 2.0, '地面': 2.0, '岩石': 2.0, '火': 0.5, '草': 0.5, '毒': 0.5, '飞行': 0.5, '虫': 0.5, '钢': 0.5, '龙': 0.5 },
  '电': { '水': 2.0, '飞行': 2.0, '电': 0.5, '草': 0.5, '龙': 0.5, '地面': 0.0 },
  '超能力': { '格斗': 2.0, '毒': 2.0, '超能力': 0.5, '钢': 0.5, '恶': 0.0 },
  '幽灵': { '幽灵': 2.0, '超能力': 2.0, '恶': 0.5, '一般': 0.0 },
  '一般': { '岩石': 0.5, '钢': 0.5, '幽灵': 0.0 },
  '格斗': { '一般': 2.0, '岩石': 2.0, '钢': 2.0, '冰': 2.0, '恶': 2.0, '飞行': 0.5, '超能力': 0.5, '虫': 0.5, '幽灵': 0.0 },
  '岩石': { '火': 2.0, '冰': 2.0, '飞行': 2.0, '虫': 2.0, '格斗': 0.5, '地面': 0.5, '钢': 0.5 },
  '地面': { '火': 2.0, '电': 2.0, '毒': 2.0, '岩石': 2.0, '钢': 2.0, '草': 0.5, '虫': 0.5, '飞行': 0.0 },
  '虫': { '草': 2.0, '超能力': 2.0, '恶': 2.0, '火': 0.5, '格斗': 0.5, '毒': 0.5, '飞行': 0.5, '幽灵': 0.5, '钢': 0.5, '仙': 0.5 },
  '龙': { '龙': 2.0, '钢': 0.5, '仙': 0.0 },
  '毒': { '草': 2.0, '仙': 2.0, '毒': 0.5, '地面': 0.5, '岩石': 0.5, '幽灵': 0.5, '钢': 0.0 },
  '冰': { '草': 2.0, '地面': 2.0, '飞行': 2.0, '龙': 2.0, '火': 0.5, '水': 0.5, '冰': 0.5, '钢': 0.5 },
};

// --- SKILL DATABASE ---
export const SKILL_DATABASE: Record<string, Skill[]> = {
  '火': [
    { name: '火花', description: '发射小型火焰攻击', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '蓄能焰袭', description: '覆盖火焰攻击，提升攻击力', power: 1.5, cd: 2, type: 'BUFF_ATK' },
    { name: '大字爆炎', description: '放出大字形状的强力火焰', power: 2.5, cd: 4, type: 'DAMAGE' },
  ],
  '水': [
    { name: '水枪', description: '喷射水流攻击', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '水流环', description: '用水幕包裹，恢复生命值', power: 2.2, cd: 5, type: 'HEAL' },
    { name: '水炮', description: '喷射猛烈的水流进行轰炸', power: 2.5, cd: 4, type: 'DAMAGE' },
  ],
  '草': [
    { name: '藤鞭', description: '像鞭子一样抽打对手', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '光合作用', description: '回复身体，恢复生命值', power: 2.4, cd: 5, type: 'HEAL' },
    { name: '日光束', description: '聚集光能发射强力光束', power: 2.8, cd: 4, type: 'DAMAGE' },
  ],
  '电': [
    { name: '电击', description: '发出电流刺激对手', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '充电', description: '积蓄电力，提升攻击', power: 1.5, cd: 2, type: 'BUFF_ATK' },
    { name: '打雷', description: '劈下剧烈的雷电', power: 2.6, cd: 4, type: 'DAMAGE' },
  ],
  '超能力': [
    { name: '念力', description: '用微弱的念力攻击', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '冥想', description: '静心凝神，提升攻击', power: 1.5, cd: 2, type: 'BUFF_ATK' },
    { name: '精神强念', description: '发射强大的念力波', power: 2.5, cd: 4, type: 'DAMAGE' },
  ],
  '幽灵': [
    { name: '舌舔', description: '用长舌头舔舐对手', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '奇异之光', description: '发射怪光，削弱对手防御', power: 0.5, cd: 2, type: 'DEBUFF_DEF' },
    { name: '暗影球', description: '投掷黑影团块攻击', power: 2.4, cd: 4, type: 'DAMAGE' },
  ],
  '一般': [
    { name: '撞击', description: '用整个身体撞向对手', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '自我再生', description: '让细胞再生，恢复体力', power: 2.2, cd: 5, type: 'HEAL' },
    { name: '破坏光线', description: '发射强烈的破坏光线', power: 3.0, cd: 5, type: 'DAMAGE' },
  ],
  '岩石': [
    { name: '落石', description: '扔出石头攻击', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '变硬', description: '全身用力，恢复微量体力并加固防御', power: 2.0, cd: 4, type: 'HEAL' },
    { name: '岩崩', description: '投掷巨大的岩石', power: 2.5, cd: 4, type: 'DAMAGE' },
  ],
  '虫': [
    { name: '吐丝', description: '吐出丝缠绕对手', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '蝶舞', description: '跳起神秘舞蹈，大幅提升攻击', power: 1.8, cd: 3, type: 'BUFF_ATK' },
    { name: '虫鸣', description: '发出震动波进行攻击', power: 2.4, cd: 4, type: 'DAMAGE' },
  ],
  '格斗': [
    { name: '空手劈', description: '用手刀劈向对手', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '健美', description: '锻炼肌肉，攻击防御提升', power: 1.5, cd: 2, type: 'BUFF_ATK' },
    { name: '爆裂拳', description: '全力挥出的爆裂一击', power: 2.8, cd: 4, type: 'DAMAGE' },
  ],
  '毒': [
    { name: '溶解液', description: '喷射强酸攻击', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '变小', description: '缩小身体，回避提升', power: 1.5, cd: 2, type: 'HEAL' }, // Flavor: Avoidance as Heal
    { name: '垃圾射击', description: '投掷垃圾进行攻击', power: 2.5, cd: 4, type: 'DAMAGE' },
  ],
  '龙': [
    { name: '龙息', description: '吹出强烈的气息', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '龙之舞', description: '神秘的舞蹈，攻击提升', power: 1.5, cd: 2, type: 'BUFF_ATK' },
    { name: '逆鳞', description: '狂暴地进行攻击', power: 3.0, cd: 5, type: 'DAMAGE' },
  ],
  // Default fallback for unknown types
  'DEFAULT': [
    { name: '普通攻击', description: '造成基础伤害', power: 1.0, cd: 0, type: 'DAMAGE' },
    { name: '战术调整', description: '提升自身攻击力', power: 1.3, cd: 2, type: 'BUFF_ATK' },
    { name: '全力一击', description: '造成大量伤害', power: 2.2, cd: 4, type: 'DAMAGE' },
  ]
};