export interface Member {
  id: string;
  name: string;
  nameKr: string;
  difficulty: number;
  cohabDifficulty: number;
  stability: number;
  description: string;
  keywords: string[];
  color: string;
}

export type PlayerRole =
  | 'exchange_student'
  | 'atiny'
  | 'intern'
  | 'tv_staff'
  | 'stylist'
  | 'translator'
  | 'parttime'
  | 'custom';

export interface PlayerSetup {
  selectedMembers: string[];
  year: number;
  role: PlayerRole;
  customRole?: string;
  playerName: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GameState {
  setup: PlayerSetup | null;
  messages: Message[];
  week: number;
  isLoading: boolean;
}
