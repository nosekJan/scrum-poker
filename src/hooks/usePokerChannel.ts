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
  votesSnapshot: Player[] | null;
  setVotesSnapshot: React.Dispatch<React.SetStateAction<Player[] | null>>;
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
  votesSnapshot,
  setVotesSnapshot,
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

  const roomStateRef = useRef({ 
    isRevealed, 
    votesSnapshot, 
    activeStory, 
    completedStories, 
    storyStartTime 
  });
  const hostIdRef = useRef<string | null>(null);
  const playersRef = useRef<Player[]>([]);
  const onLeaveRef = useRef(onLeave);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    roomStateRef.current = { isRevealed, votesSnapshot, activeStory, completedStories, storyStartTime };
  }, [isRevealed, votesSnapshot, activeStory, completedStories, storyStartTime]);

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
        const keys = Object.keys(state);
        const firstAvailableId = keys[0] || null;

        for (const [key, presenceArray] of Object.entries(state)) {
          const sortedPresence = [...(presenceArray as any[])].sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
          const playerData = sortedPresence[0];
          if (!playerData) continue;
          
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
            const sortedPresence = [...(presenceArray as any[])].sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
            const playerData = sortedPresence[0];
            if (!playerData) continue;

            const existingPlayer = prevPlayers.find((p) => p.id === key);
            
            const isVoteStale = playerData.voteCastAt && 
                                roomStateRef.current.storyStartTime && 
                                playerData.voteCastAt < roomStateRef.current.storyStartTime;

            const currentCard = isVoteStale 
              ? null 
              : (existingPlayer && existingPlayer.selectedCard !== null
                  ? existingPlayer.selectedCard
                  : (playerData.selectedCard || null));

            activePlayers.push({
              id: key,
              name: playerData.name,
              selectedCard: currentCard,
              joinedAt: playerData.joinedAt || Date.now(),
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
        const { isRevealed: reveal, votesSnapshot: snapshot } = payload.payload;
        setIsRevealed(reveal);
        if (reveal) {
          setVotesSnapshot(snapshot || null);
        } else {
          setVotesSnapshot(null);
          updatePresence({ selectedCard: null, voteCastAt: null });
        }
      })
      .on("broadcast", { event: "story_state" }, (payload) => {
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime);
        if (payload.payload.resetVotes) {
          setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
          setIsRevealed(false);
          setVotesSnapshot(null);
        }
      })
      .on("broadcast", { event: "revote" }, (payload) => {
        setIsRevealed(false);
        setVotesSnapshot(null);
        setStoryStartTime(payload.payload.storyStartTime || null);
        setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
        updatePresence({ selectedCard: null, voteCastAt: null });
      })
      .on("broadcast", { event: "session_ended" }, () => {
        onLeaveRef.current();
      })
      .on("broadcast", { event: "request_sync" }, () => {
        const currentHostId = hostIdRef.current;
        if (currentHostId === myUserId || !currentHostId) {
          roomChannel.send({
            type: "broadcast",
            event: "sync_response",
            payload: roomStateRef.current,
          });
        }
      })
      .on("broadcast", { event: "sync_response" }, (payload) => {
        setIsRevealed(payload.payload.isRevealed);
        setVotesSnapshot(payload.payload.votesSnapshot || null);
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