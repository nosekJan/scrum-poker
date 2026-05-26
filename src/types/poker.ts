export type CardValue = '0' | '0.5' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | '☕';

export interface Player {
  id: string;
  name: string;
  selectedCard: CardValue | null;
}

export interface GameState {
  roomId: string;
  status: 'voting' | 'revealed';
}