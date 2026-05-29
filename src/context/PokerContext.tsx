import React, { createContext, useContext } from "react";
import { usePokerGame } from "../hooks/usePokerGame";
import type { Player, CardValue, Story } from "../types/poker";

interface PokerContextType {
  players: Player[];
  votesSnapshot: Player[] | null;
  castVote: (card: CardValue | null) => void;
  isRevealed: boolean;
  toggleReveal: (reveal: boolean) => void;
  activeStory: string | null;
  completedStories: Story[];
  startStoryGrooming: (title: string) => void;
  saveAndNextStory: (estimate: string) => Promise<void>;
  triggerRevote: () => void;
  storyStartTime: number | null;
  deleteStory: (storyId: string) => Promise<void>;
  hostId: string | null;
  endSession: () => void;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

export const PokerProvider: React.FC<{
  roomId: string;
  playerName: string;
  onLeave: () => void;
  children: React.ReactNode;
}> = ({ roomId, playerName, onLeave, children }) => {
  const poker = usePokerGame(roomId, playerName, onLeave);

  return (
    <PokerContext.Provider value={poker}>{children}</PokerContext.Provider>
  );
};

export const usePoker = () => {
  const context = useContext(PokerContext);
  if (!context) {
    throw new Error("usePoker must be used within a PokerProvider");
  }
  return context;
};
