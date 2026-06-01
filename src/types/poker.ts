export type CardValue = '0' | '0.5' | '1' | '2' | '3' | '5' | '8' | '13' | '20' | '40' | '100' | '?' | '☕';

export interface Player {
  id: string;
  name: string;
  selectedCard: CardValue | null;
  joinedAt: number;
}

export interface GameState {
  roomId: string;
  status: 'voting' | 'revealed';
}

export interface Story {
  id: string;
  title: string;
  estimate: string;
  time?: string;
  createdAt: string;
}