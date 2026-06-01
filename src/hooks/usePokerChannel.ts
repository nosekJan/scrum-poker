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
  const exitedHostsRef = useRef<Record<string, number>>({});

  const roomStateRef = useRef({ 
    isRevealed, 
    votesSnapshot, 
    activeStory, 
    completedStories, 
    storyStartTime,
    players 
  });
  
  const hostIdRef = useRef<string | null>(null);
  const playersRef = useRef<Player[]>([]);
  const onLeaveRef = useRef(onLeave);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    roomStateRef.current = { isRevealed, votesSnapshot, activeStory, completedStories, storyStartTime, players };
  }, [isRevealed, votesSnapshot, activeStory, completedStories, storyStartTime, players]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    onLeaveRef.current = onLeave;
    playerNameRef.current = playerName;
  }, [onLeave, playerName]);

  const updatePresence = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.track({
      name: playerNameRef.current,
      joinedAt: joinedAtRef.current,
    }).catch(() => {});
  }, []);

  const broadcastLeave = useCallback(() => {
    if (channelRef.current && hostIdRef.current === myUserId) {
      channelRef.current.send({
        type: "broadcast",
        event: "host_leaving",
        payload: { userId: myUserId, timestamp: Date.now() },
      });
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      broadcastLeave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [broadcastLeave]);

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
        const firstAvailableId = keys.filter(k => {
          const exitTime = exitedHostsRef.current[k];
          const pData = (state[k] as any[])?.[0];
          return !exitTime || (pData && (pData.joinedAt || 0) > exitTime);
        })[0] || null;

        for (const [key, presenceArray] of Object.entries(state)) {
          const sortedPresence = [...(presenceArray as any[])].sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
          const playerData = sortedPresence[0];
          if (!playerData) continue;
          
          const exitTime = exitedHostsRef.current[key];
          if (exitTime && (playerData.joinedAt || 0) <= exitTime) {
            continue;
          }

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

            const exitTime = exitedHostsRef.current[key];
            if (exitTime && (playerData.joinedAt || 0) <= exitTime) {
              continue;
            }

            const existingPlayer = prevPlayers.find((p) => p.id === key);

            activePlayers.push({
              id: key,
              name: playerData.name,
              selectedCard: existingPlayer ? existingPlayer.selectedCard : null,
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
        }
      })
      .on("broadcast", { event: "story_state" }, (payload) => {
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime);
        roomStateRef.current.storyStartTime = payload.payload.storyStartTime;
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
        roomStateRef.current.storyStartTime = payload.payload.storyStartTime || null;
        setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
      })
      .on("broadcast", { event: "host_leaving" }, (payload) => {
        const { userId, timestamp } = payload.payload;
        exitedHostsRef.current[userId] = timestamp;
        setPlayers((prev) => prev.filter((p) => p.id !== userId));
        setHostId((current) => {
          if (current === userId) {
            const remaining = playersRef.current.filter((p) => p.id !== userId);
            if (remaining.length > 0) {
              const sorted = [...remaining].sort((a, b) => a.joinedAt - b.joinedAt);
              const nextHostId = sorted[0].id;
              hostIdRef.current = nextHostId;
              return nextHostId;
            }
            hostIdRef.current = null;
            return null;
          }
          return current;
        });
      })
      .on("broadcast", { event: "session_ended" }, () => {
        onLeaveRef.current();
      })
      .on("broadcast", { event: "request_sync" }, () => {
        if (hostIdRef.current === myUserId) {
          roomChannel.send({
            type: "broadcast",
            event: "sync_response",
            payload: roomStateRef.current,
          });
        }
      })
      .on("broadcast", { event: "sync_response" }, (payload) => {
        if (hostIdRef.current === myUserId) return;
        setIsRevealed(payload.payload.isRevealed);
        setVotesSnapshot(payload.payload.votesSnapshot || null);
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime);
        roomStateRef.current.storyStartTime = payload.payload.storyStartTime;
        
        if (payload.payload.players) {
          setPlayers((prev) => prev.map((p) => {
            const syncedPlayer = payload.payload.players.find((sp: Player) => sp.id === p.id);
            return syncedPlayer ? { ...p, selectedCard: syncedPlayer.selectedCard } : p;
          }));
        }
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          updatePresence();
          roomChannel.send({ type: "broadcast", event: "request_sync", payload: {} });
        }
      });

    return () => {
      broadcastLeave();
      supabase.removeChannel(roomChannel);
      channelRef.current = null;
    };
  }, [roomId, updatePresence, broadcastLeave]);

  return { channelRef, updatePresence, roomStateRef };
};