export type PetType = 'rabbit' | 'cat' | 'chick';

export interface PetState {
  name: string;
  type: PetType;
  happiness: number; // 0-100
  fullness: number;  // 0-100
  energy: number;    // 0-100
  level: number;
  xp: number;
  accessory: 'none' | 'ribbon' | 'crown' | 'glasses' | 'hat';
  isSleeping: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
}

export interface StickyNote {
  id: string;
  text: string;
  color: 'pink' | 'yellow' | 'green' | 'purple' | 'blue';
  createdAt: string;
}

export interface MoodRecord {
  mood: 'happy' | 'cozy' | 'sleepy' | 'sad' | 'excited';
  date: string;
}

export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  fullnessRestore: number;
  energyRestore: number;
  happinessRestore: number;
  soundPitch: number; // For custom synth feedback
  flavorText: string;
}

export interface ToyItem {
  id: string;
  name: string;
  icon: string;
  energyCost: number;
  happinessRestore: number;
  soundPitch: number;
  flavorText: string;
}
