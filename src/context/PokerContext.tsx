import React, { createContext, useContext, useEffect, useRef } from "react";
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
  kickPlayer: (playerId: string) => Promise<void>;
  promotePlayer: (playerId: string) => Promise<void>;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

export const PokerProvider: React.FC<{
  roomId: string;
  playerName: string;
  onLeave: () => void;
  children: React.ReactNode;
}> = ({ roomId, playerName, onLeave, children }) => {
  const poker = usePokerGame(roomId, playerName, onLeave);
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    if (!poker.isRevealed) {
      hasFiredConfetti.current = false;
      return;
    }

    if (
      poker.isRevealed &&
      !hasFiredConfetti.current &&
      poker.players.length > 0
    ) {
      const validVotes = poker.players
        .map((p) => p.selectedCard)
        .filter((v): v is CardValue => v !== null);

      if (validVotes.length === poker.players.length) {
        const isUnanimous = validVotes.every((v) => v === validVotes[0]);

        if (isUnanimous) {
          hasFiredConfetti.current = true;
          import("canvas-confetti")
            .then((module) => {
              const confetti = module.default;
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ["#10b981", "#34d399", "#6ee7b7", "#ffffff"],
              });
            })
            .catch((err) => console.error(err));
        }
      }
    }
  }, [poker.isRevealed, poker.players]);

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
