export type CardValue = '0' | '0.5' | '1' | '2' | '3' | '5' | '8' | '13' | '20' | '40' | '100' | '?' | '☕';

export interface Player {
  id: string;
  name: string;
  selectedCard: CardValue | null;
  joinedAt: number;
  emojiSeed?: number;
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

export interface PresencePayload {
  presence_ref: string;
  name: string;
  joinedAt?: number;
  emojiSeed?: number;
  customHostId?: string | null;
}

export interface VotePayload {
  userId: string;
  card: CardValue | null;
}

export interface RevealStatePayload {
  isRevealed: boolean;
  votesSnapshot: Player[] | null;
}

export interface StoryStatePayload {
  activeStory: string | null;
  completedStories: Story[];
  storyStartTime: number | null;
  resetVotes?: boolean;
}

export interface RevotePayload {
  storyStartTime: number | null;
}

export interface PlayerLeavingPayload {
  userId: string;
  timestamp?: number;
}

export interface SyncResponsePayload {
  customHostId?: string | null;
  isRevealed: boolean;
  votesSnapshot: Player[] | null;
  activeStory: string | null;
  completedStories: Story[];
  storyStartTime: number | null;
  players?: Player[];
}

export interface PromoteHostPayload {
  hostId: string;
  username?: string;
}

export interface KickPlayerPayload {
  playerId: string;
}

export interface RealtimeEvent<T> {
  payload: T;
}

export interface RoomState {
  isRevealed: boolean;
  votesSnapshot: Player[] | null;
  activeStory: string | null;
  completedStories: Story[];
  storyStartTime: number | null;
  players: Player[];
  customHostId: string | null;
}