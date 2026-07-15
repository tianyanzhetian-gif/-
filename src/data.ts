import { FoodItem, ToyItem } from "./types";

export const FOOD_ITEMS: FoodItem[] = [
  {
    id: "carrot_strawberry",
    name: "甜甜草莓",
    icon: "🍓",
    fullnessRestore: 25,
    energyRestore: 10,
    happinessRestore: 15,
    soundPitch: 1.2,
    flavorText: "新鲜多汁的草莓，甜丝丝的超好吃！"
  },
  {
    id: "cookie",
    name: "魔法曲奇",
    icon: "🍪",
    fullnessRestore: 35,
    energyRestore: 15,
    happinessRestore: 20,
    soundPitch: 0.9,
    flavorText: "刚烤出来的巧克力豆曲奇，散发着诱人香气~"
  },
  {
    id: "ice_cream",
    name: "香草甜筒",
    icon: "🍦",
    fullnessRestore: 20,
    energyRestore: 5,
    happinessRestore: 30,
    soundPitch: 1.5,
    flavorText: "冰冰凉凉的甜筒，是宠物的快乐源泉！"
  },
  {
    id: "star_candy",
    name: "七彩星星糖",
    icon: "🍬",
    fullnessRestore: 15,
    energyRestore: 25,
    happinessRestore: 25,
    soundPitch: 1.8,
    flavorText: "亮晶晶的糖果，吃一颗心情就会变彩色！"
  }
];

export const TOY_ITEMS: ToyItem[] = [
  {
    id: "yarn",
    name: "彩色毛线球",
    icon: "🧶",
    energyCost: 15,
    happinessRestore: 25,
    soundPitch: 1.0,
    flavorText: "滚来滚去的毛线球，怎么抓都玩不腻！"
  },
  {
    id: "ball",
    name: "弹弹小皮球",
    icon: "⚽",
    energyCost: 20,
    happinessRestore: 30,
    soundPitch: 1.3,
    flavorText: "高高弹起的玩具皮球，可以消耗宠物的充沛精力！"
  },
  {
    id: "wand",
    name: "爱心魔法棒",
    icon: "🪄",
    energyCost: 25,
    happinessRestore: 40,
    soundPitch: 1.6,
    flavorText: "挥动它，会有爱心魔法光芒闪烁哦！"
  }
];

export const ACCESSORY_ITEMS = [
  { id: "none", name: "无饰品", icon: "❌" },
  { id: "ribbon", name: "粉红蝴蝶结", icon: "🎀" },
  { id: "crown", name: "迷你皇冠", icon: "👑" },
  { id: "glasses", name: "红框圆眼镜", icon: "👓" },
  { id: "hat", name: "可爱小草帽", icon: "👒" }
];

export const INITIAL_STICKY_NOTES = [
  {
    id: "note-1",
    text: "🌸 欢迎来到你的口袋萌宠绿洲！你可以给宠物改名字，或者在右侧和它聊天说话哦！",
    color: "pink" as const,
    createdAt: new Date().toLocaleDateString()
  },
  {
    id: "note-2",
    text: "⭐ 点击宠物会给它摸摸，它会开心地脸红并发出爱心呢！",
    color: "yellow" as const,
    createdAt: new Date().toLocaleDateString()
  }
];
