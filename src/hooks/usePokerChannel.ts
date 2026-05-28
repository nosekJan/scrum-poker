import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { myUserId } from "../utils/poker";
import type { Player, CardValue, Story } from "../types/poker";

interface UsePokerChannelProps {
  roomId: string;
  playerName: string;
  onLeave: () => void;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  isRevealed: boolean;
  setIsRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  setHostId: React.Dispatch<React.SetStateAction<string | null>>;
  activeStory: string | null;
  setActiveStory: React.Dispatch<React.SetStateAction<string | null>>;
  completedStories: Story[];
  setCompletedStories: React.Dispatch<React.SetStateAction<Story[]>>;
  storyStartTime: number | null;
  setStoryStartTime: React.Dispatch<React.SetStateAction<number | null>>;
}

export const usePokerChannel = ({
  roomId,
  playerName,
  onLeave,
  players,
  setPlayers,
  isRevealed,
  setIsRevealed,
  setHostId,
  activeStory,
  setActiveStory,
  completedStories,
  setCompletedStories,
  storyStartTime,
  setStoryStartTime,
}: UsePokerChannelProps) => {
  const channelRef = useRef<any>(null);
  const joinedAtRef = useRef(Date.now());
  const myCardRef = useRef<CardValue | null>(null);

  const roomStateRef = useRef({ isRevealed, activeStory, completedStories, storyStartTime });
  const hostIdRef = useRef<string | null>(null);
  const playersRef = useRef<Player[]>([]);
  const onLeaveRef = useRef(onLeave);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    roomStateRef.current = { isRevealed, activeStory, completedStories, storyStartTime };
  }, [isRevealed, activeStory, completedStories, storyStartTime]);

  useEffect(() => {
    playersRef.current = players;
    const me = players.find((p) => p.id === myUserId);
    if (me) myCardRef.current = me.selectedCard;
  }, [players]);

  useEffect(() => {
    onLeaveRef.current = onLeave;
    playerNameRef.current = playerName;
  }, [onLeave, playerName]);

  const updatePresence = useCallback((overrides: any = {}) => {
    if (!channelRef.current) return;
    channelRef.current.track({
      name: playerNameRef.current,
      selectedCard: myCardRef.current,
      joinedAt: joinedAtRef.current,
      ...overrides
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: { presence: { key: myUserId } },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on("presence", { event: "sync" }, () => {
        const state = roomChannel.presenceState();
        
        let oldestTime = Infinity;
        let currentHostId: string | null = null;
        let firstAvailableId: string | null = null;

        for (const [key, presenceArray] of Object.entries(state)) {
          const playerData = (presenceArray as any[])[0];
          
          if (!firstAvailableId) firstAvailableId = key;
          
          const jTime = playerData.joinedAt || Date.now();
          if (jTime < oldestTime) {
            oldestTime = jTime;
            currentHostId = key;
          }
        }

        const finalHostId = currentHostId || firstAvailableId;
        setHostId(finalHostId);
        hostIdRef.current = finalHostId;

        setPlayers((prevPlayers) => {
          const activePlayers: Player[] = [];
          for (const [key, presenceArray] of Object.entries(state)) {
            const playerData = (presenceArray as any[])[0];
            const existingPlayer = prevPlayers.find((p) => p.id === key);
            const currentCard = existingPlayer && existingPlayer.selectedCard !== null
              ? existingPlayer.selectedCard
              : playerData.selectedCard || null;

            activePlayers.push({
              id: key,
              name: playerData.name,
              selectedCard: currentCard,
            });
          }
          activePlayers.sort((a, b) => a.name.localeCompare(b.name));
          return activePlayers;
        });
      })
      .on("broadcast", { event: "vote" }, (payload) => {
        const { userId, card } = payload.payload;
        setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p)));
      })
      .on("broadcast", { event: "reveal_state" }, (payload) => {
        const reveal = payload.payload.isRevealed;
        setIsRevealed(reveal);
        if (!reveal) updatePresence({ selectedCard: null });
      })
      .on("broadcast", { event: "story_state" }, (payload) => {
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime);
        if (payload.payload.resetVotes) {
          setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
          setIsRevealed(false);
        }
      })
      .on("broadcast", { event: "revote" }, () => {
        setIsRevealed(false);
        setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
        updatePresence({ selectedCard: null });
      })
      .on("broadcast", { event: "session_ended" }, () => {
        onLeaveRef.current();
      })
      .on("broadcast", { event: "request_sync" }, () => {
        const currentHostId = hostIdRef.current;
        if (currentHostId === myUserId) {
          roomChannel.send({
            type: "broadcast",
            event: "sync_response",
            payload: roomStateRef.current,
          });
        }
      })
      .on("broadcast", { event: "sync_response" }, (payload) => {
        setIsRevealed(payload.payload.isRevealed);
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime);
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          updatePresence();
          roomChannel.send({ type: "broadcast", event: "request_sync", payload: {} });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
      channelRef.current = null;
    };
  }, [roomId, updatePresence]);

  return { channelRef, updatePresence };
};