import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { usePokerGame } from "../hooks/usePokerGame";
import type { Player, CardValue, Story } from "../types/poker";
import type {
  RoomNotification,
  RoomNotificationType,
} from "../components/RoomNotifications";

interface PokerContextType {
  roomId: string;
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
  leaveRoom: () => Promise<void>;
  notifications: RoomNotification[];
  isKicked: boolean;
  isSessionEnded: boolean;
}

export const PokerContext = createContext<PokerContextType | undefined>(
  undefined,
);

export const PokerProvider: React.FC<{
  roomId: string;
  playerName: string;
  onLeave: () => void;
  children: React.ReactNode;
}> = ({ roomId, playerName, onLeave, children }) => {
  const poker = usePokerGame(roomId, playerName, onLeave);
  const hasFiredConfetti = useRef(false);

  const [notifications, setNotifications] = useState<RoomNotification[]>([]);
  const prevPlayersRef = useRef<Player[] | null>(null);
  const isInitialLoad = useRef(true);

  const addNotification = useCallback(
    (type: RoomNotificationType, username: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { id, type, username }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3000);
    },
    [],
  );

  useEffect(() => {
    if (isInitialLoad.current) {
      if (poker.players.length > 0) {
        prevPlayersRef.current = poker.players;
        isInitialLoad.current = false;
      }
      return;
    }

    const prevPlayers = prevPlayersRef.current || [];
    const currentPlayers = poker.players;

    const joined = currentPlayers.filter(
      (cp) => !prevPlayers.some((pp) => pp.id === cp.id),
    );

    const left = prevPlayers.filter(
      (pp) => !currentPlayers.some((cp) => cp.id === pp.id),
    );

    joined.forEach((player) => {
      addNotification("join", player.name);
    });

    left.forEach((player) => {
      addNotification("leave", player.name);
    });

    prevPlayersRef.current = currentPlayers;
  }, [poker.players, addNotification]);

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

  const contextValue = useMemo(
    () => ({
      ...poker,
      roomId,
      notifications,
    }),
    [poker, roomId, notifications],
  );

  return (
    <PokerContext.Provider value={contextValue}>
      {children}
    </PokerContext.Provider>
  );
};
