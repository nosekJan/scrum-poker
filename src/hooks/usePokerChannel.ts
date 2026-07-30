import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { myUserId } from "../utils/poker";
import type { Player, Story } from "../types/poker";

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
  const emojiSeedRef = useRef(Math.random());
  const exitedHostsRef = useRef<Record<string, number>>({});
  const customHostIdRef = useRef<string | null>(null);

  const roomStateRef = useRef({
    isRevealed,
    votesSnapshot,
    activeStory,
    completedStories,
    storyStartTime,
    players,
    customHostId: null as string | null,
  });

  const hostIdRef = useRef<string | null>(null);
  const playersRef = useRef<Player[]>([]);
  const onLeaveRef = useRef(onLeave);
  const playerNameRef = useRef(playerName);

  const [isKicked, setIsKicked] = useState<boolean>(false);

  useEffect(() => {
    roomStateRef.current = {
      isRevealed,
      votesSnapshot,
      activeStory,
      completedStories,
      storyStartTime,
      players,
      customHostId: customHostIdRef.current,
    };
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
    delete exitedHostsRef.current[myUserId];
    joinedAtRef.current = Date.now();
    channelRef.current.track({
      name: playerNameRef.current,
      joinedAt: joinedAtRef.current,
      emojiSeed: emojiSeedRef.current,
    }).catch(() => {});
  }, []);

  const broadcastLeave = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "player_leaving",
        payload: { userId: myUserId, timestamp: Date.now() },
      });
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    broadcastLeave();
    if (channelRef.current) {
      try {
        await channelRef.current.untrack();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.error(e);
      } finally {
        channelRef.current = null;
      }
    }
  }, [broadcastLeave]);

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
    const channelName = `room_${roomId}`;
    const existingChannel = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const roomChannel = supabase.channel(channelName, {
      config: { presence: { key: myUserId } },
    });

    channelRef.current = roomChannel;

    const handlePresenceSync = () => {
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

        if (exitTime) {
          delete exitedHostsRef.current[key];
        }

        const jTime = playerData.joinedAt || Date.now();
        if (jTime < oldestTime) {
          oldestTime = jTime;
          currentHostId = key;
        }
      }

      const isCustomHostPresent = customHostIdRef.current &&
        state[customHostIdRef.current] &&
        (!exitedHostsRef.current[customHostIdRef.current] ||
          ((state[customHostIdRef.current] as any[])?.[0]?.joinedAt || 0) > exitedHostsRef.current[customHostIdRef.current]);

      const finalHostId = isCustomHostPresent
        ? customHostIdRef.current
        : (currentHostId || firstAvailableId);

      if (!isCustomHostPresent) {
        customHostIdRef.current = null;
      }

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
            emojiSeed: playerData.emojiSeed,
          } as any);
        }
        activePlayers.sort((a, b) => a.name.localeCompare(b.name));
        return activePlayers;
      });
    };

    const handleVote = (payload: any) => {
      const { userId, card } = payload.payload;
      setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p)));
    };

    const handleRevealState = (payload: any) => {
      const { isRevealed: reveal, votesSnapshot: snapshot } = payload.payload;
      setIsRevealed(reveal);
      if (reveal) {
        setVotesSnapshot(snapshot || null);
      } else {
        setVotesSnapshot(null);
      }
    };

    const handleStoryState = (payload: any) => {
      setActiveStory(payload.payload.activeStory);
      setCompletedStories(payload.payload.completedStories);
      setStoryStartTime(payload.payload.storyStartTime);
      roomStateRef.current.storyStartTime = payload.payload.storyStartTime;
      if (payload.payload.resetVotes) {
        setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
        setIsRevealed(false);
        setVotesSnapshot(null);
      }
    };

    const handleRevote = (payload: any) => {
      setIsRevealed(false);
      setVotesSnapshot(null);
      setStoryStartTime(payload.payload.storyStartTime || null);
      roomStateRef.current.storyStartTime = payload.payload.storyStartTime || null;
      setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
    };

    const handlePlayerLeaving = (payload: any) => {
      const { userId, timestamp } = payload.payload;
      exitedHostsRef.current[userId] = timestamp || Date.now();
      setPlayers((prev) => prev.filter((p) => p.id !== userId));

      if (customHostIdRef.current === userId) {
        customHostIdRef.current = null;
      }

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
    };

    const handleSessionEnded = () => {
      onLeaveRef.current();
    };

    const handleRequestSync = () => {
      if (hostIdRef.current === myUserId) {
        roomChannel.send({
          type: "broadcast",
          event: "sync_response",
          payload: roomStateRef.current,
        });
      }
    };

    const handleSyncResponse = (payload: any) => {
      if (hostIdRef.current === myUserId) return;
      setIsRevealed(payload.payload.isRevealed);
      setVotesSnapshot(payload.payload.votesSnapshot || null);
      setActiveStory(payload.payload.activeStory);
      setCompletedStories(payload.payload.completedStories);
      setStoryStartTime(payload.payload.storyStartTime);
      roomStateRef.current.storyStartTime = payload.payload.storyStartTime;

      if (payload.payload.customHostId) {
        customHostIdRef.current = payload.payload.customHostId;
        setHostId(payload.payload.customHostId);
        hostIdRef.current = payload.payload.customHostId;
      }

      if (payload.payload.players) {
        setPlayers((prev) => prev.map((p) => {
          const syncedPlayer = payload.payload.players.find((sp: Player) => sp.id === p.id);
          return syncedPlayer ? { ...p, selectedCard: syncedPlayer.selectedCard } : p;
        }));
      }
    };

    const handlePromoteHost = (payload: any) => {
      const { hostId: nextHostId } = payload.payload;
      customHostIdRef.current = nextHostId;
      setHostId(nextHostId);
      hostIdRef.current = nextHostId;
    };

   const handleKickPlayer = (payload: any) => {
      const { playerId } = payload.payload;
      exitedHostsRef.current[playerId] = Date.now();
      if (playerId === myUserId) {
        setIsKicked(true);
        if (channelRef.current) {
          channelRef.current.untrack().catch(() => {});
        }
      } else {
        setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      }
    };

   roomChannel
      .on("presence", { event: "sync" }, handlePresenceSync)
      .on("broadcast", { event: "vote" }, handleVote)
      .on("broadcast", { event: "reveal_state" }, handleRevealState)
      .on("broadcast", { event: "story_state" }, handleStoryState)
      .on("broadcast", { event: "revote" }, handleRevote)
      .on("broadcast", { event: "player_leaving" }, handlePlayerLeaving)
      .on("broadcast", { event: "host_leaving" }, handlePlayerLeaving)
      .on("broadcast", { event: "session_ended" }, handleSessionEnded)
      .on("broadcast", { event: "request_sync" }, handleRequestSync)
      .on("broadcast", { event: "sync_response" }, handleSyncResponse)
      .on("broadcast", { event: "promote_host" }, handlePromoteHost)
      .on("broadcast", { event: "kick_player" }, handleKickPlayer)
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          updatePresence();
          roomChannel.send({ type: "broadcast", event: "request_sync", payload: {} });
        }
      });

    return () => {
      broadcastLeave();
      if (channelRef.current) {
        const currentChannel = channelRef.current;
        channelRef.current = null;
        currentChannel.untrack().finally(() => {
          supabase.removeChannel(currentChannel);
        });
      }
    };
  }, [roomId, updatePresence, broadcastLeave]);

  const kickPlayer = useCallback(async (playerId: string) => {
    exitedHostsRef.current[playerId] = Date.now();
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "kick_player",
        payload: { playerId },
      });
    }
  }, [setPlayers]);

  return { channelRef, updatePresence, roomStateRef, leaveRoom, isKicked, kickPlayer };
};