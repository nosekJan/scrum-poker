import { useEffect, useRef, useCallback, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { myUserId } from "../utils/poker";
import type { Player, Story, CardValue } from "../types/poker";

interface PresencePayload {
  presence_ref: string;
  name: string;
  joinedAt?: number;
  emojiSeed?: number;
  customHostId?: string | null;
}

interface VotePayload {
  userId: string;
  card: CardValue | null;
}

interface RevealStatePayload {
  isRevealed: boolean;
  votesSnapshot: Player[] | null;
}

interface StoryStatePayload {
  activeStory: string | null;
  completedStories: Story[];
  storyStartTime: number | null;
  resetVotes?: boolean;
}

interface RevotePayload {
  storyStartTime: number | null;
}

interface PlayerLeavingPayload {
  userId: string;
  timestamp?: number;
}

interface SyncResponsePayload {
  customHostId?: string | null;
  isRevealed: boolean;
  votesSnapshot: Player[] | null;
  activeStory: string | null;
  completedStories: Story[];
  storyStartTime: number | null;
  players?: Player[];
}

interface PromoteHostPayload {
  hostId: string;
  username?: string;
}

interface KickPlayerPayload {
  playerId: string;
}

interface RealtimeEvent<T> {
  payload: T;
}
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
  addNotification?: (type: "join" | "leave" | "kick" | "promote", username: string) => void;
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
  addNotification,
}: UsePokerChannelProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinedAtRef = useRef(Date.now());
  const emojiSeedRef = useRef(Math.random());
  const exitedHostsRef = useRef<Record<string, number>>({});
  const kickedUserIdsRef = useRef<Set<string>>(new Set());
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
  const addNotificationRef = useRef(addNotification);
  const isSubscribedRef = useRef<boolean>(false);

  const [isKicked, setIsKicked] = useState<boolean>(false);
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);

  const updatePresence = useCallback((nextCustomHostId?: string | null) => {
    if (!channelRef.current) return;
    delete exitedHostsRef.current[myUserId];
    joinedAtRef.current = Date.now();
    const hostToTrack = nextCustomHostId !== undefined ? nextCustomHostId : customHostIdRef.current;
    channelRef.current.track({
      name: playerNameRef.current,
      joinedAt: joinedAtRef.current,
      emojiSeed: emojiSeedRef.current,
      customHostId: hostToTrack,
    }).catch(() => {});
  }, []);

  const handlePromoteHost = useCallback((event: RealtimeEvent<PromoteHostPayload>) => {
    const { hostId: nextHostId, username } = event.payload;
    customHostIdRef.current = nextHostId;
    roomStateRef.current.customHostId = nextHostId;
    setHostId(nextHostId);
    hostIdRef.current = nextHostId;

    updatePresence(nextHostId);

    const targetPlayer = playersRef.current.find((p) => p.id === nextHostId);
    const promotedName = username || targetPlayer?.name;
    if (promotedName && addNotificationRef.current) {
      addNotificationRef.current("promote", promotedName);
    }
  }, [setHostId, updatePresence]);

  const handlePromoteHostRef = useRef(handlePromoteHost);

  useEffect(() => {
    handlePromoteHostRef.current = handlePromoteHost;
  }, [handlePromoteHost]);

  useEffect(() => {
    playersRef.current = players;
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
    onLeaveRef.current = onLeave;
    playerNameRef.current = playerName;
    addNotificationRef.current = addNotification;
  }, [onLeave, playerName, addNotification]);

  const broadcastLeave = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
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
      let defaultHostId: string | null = null;
      const activePlayersMap: Record<string, PresencePayload> = {};

      let presenceCustomHostId: string | null = null;

      for (const [key, rawPresenceArray] of Object.entries(state)) {
        const presenceArray = rawPresenceArray as unknown as PresencePayload[];
        if (!Array.isArray(presenceArray) || presenceArray.length === 0) continue;

        const sortedPresence = [...presenceArray].sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
        const playerData = sortedPresence[0];
        if (!playerData) continue;

        if (playerData.customHostId) {
          presenceCustomHostId = playerData.customHostId;
        }

        const exitTime = exitedHostsRef.current[key];
        if (exitTime && (playerData.joinedAt || 0) <= exitTime) {
          continue;
        }

        if (exitTime) {
          delete exitedHostsRef.current[key];
        }

        activePlayersMap[key] = playerData;

        const jTime = playerData.joinedAt || Date.now();
        if (jTime < oldestTime) {
          oldestTime = jTime;
          defaultHostId = key;
        }
      }

      const activeKeys = Object.keys(activePlayersMap);
      if (activeKeys.length === 0) return;

      const currentCustomHost = presenceCustomHostId || customHostIdRef.current || roomStateRef.current.customHostId;
      const isCustomHostExited = Boolean(currentCustomHost && exitedHostsRef.current[currentCustomHost]);

      if (isCustomHostExited) {
        customHostIdRef.current = null;
      } else if (currentCustomHost) {
        customHostIdRef.current = currentCustomHost;
      }

      roomStateRef.current.customHostId = customHostIdRef.current;

      const finalHostId = (customHostIdRef.current && activeKeys.includes(customHostIdRef.current))
        ? customHostIdRef.current
        : defaultHostId;


      setHostId(finalHostId);
      hostIdRef.current = finalHostId;

      setPlayers((prevPlayers) => {
        const activePlayers: Player[] = [];
        for (const [key, playerData] of Object.entries(activePlayersMap)) {
          const existingPlayer = prevPlayers.find((p) => p.id === key);

          activePlayers.push({
            id: key,
            name: playerData.name,
            selectedCard: existingPlayer ? existingPlayer.selectedCard : null,
            joinedAt: playerData.joinedAt || Date.now(),
            emojiSeed: playerData.emojiSeed,
          });
        }
        activePlayers.sort((a, b) => a.name.localeCompare(b.name));
        return activePlayers;
      });
    };

    const handleVote = (event: RealtimeEvent<VotePayload>) => {
      const { userId, card } = event.payload;
      setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p)));
    };

    const handleRevealState = (event: RealtimeEvent<RevealStatePayload>) => {
      const { isRevealed: reveal, votesSnapshot: snapshot } = event.payload;
      setIsRevealed(reveal);
      if (reveal) {
        setVotesSnapshot(snapshot || null);
      } else {
        setVotesSnapshot(null);
      }
    };

    const handleStoryState = (event: RealtimeEvent<StoryStatePayload>) => {
      const { activeStory, completedStories, storyStartTime, resetVotes } = event.payload;
      setActiveStory(activeStory);
      setCompletedStories(completedStories);
      setStoryStartTime(storyStartTime);
      roomStateRef.current.storyStartTime = storyStartTime;
      if (resetVotes) {
        setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
        setIsRevealed(false);
        setVotesSnapshot(null);
      }
    };

    const handleRevote = (event: RealtimeEvent<RevotePayload>) => {
      const { storyStartTime } = event.payload;
      setIsRevealed(false);
      setVotesSnapshot(null);
      setStoryStartTime(storyStartTime || null);
      roomStateRef.current.storyStartTime = storyStartTime || null;
      setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
    };

    const handlePlayerLeaving = (event: RealtimeEvent<PlayerLeavingPayload>) => {
      const { userId, timestamp } = event.payload;
      exitedHostsRef.current[userId] = timestamp || Date.now();
      setPlayers((prev) => prev.filter((p) => p.id !== userId));

      if (customHostIdRef.current === userId) {
        customHostIdRef.current = null;
        roomStateRef.current.customHostId = null;
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
      if (kickedUserIdsRef.current.has(myUserId)) return;
      setIsSessionEnded(true);
      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const handleRequestSync = () => {
      const activeCustomHost = customHostIdRef.current || roomStateRef.current.customHostId;
      const isCurrentHost = hostIdRef.current === myUserId;

      if (isCurrentHost) {
        roomStateRef.current.customHostId = activeCustomHost;
        roomChannel.send({
          type: "broadcast",
          event: "sync_response",
          payload: roomStateRef.current,
        });
      }
    };

    const handleSyncResponse = (event: RealtimeEvent<SyncResponsePayload>) => {
      const {
        customHostId: incomingCustomHost,
        isRevealed: syncIsRevealed,
        votesSnapshot: syncVotesSnapshot,
        activeStory: syncActiveStory,
        completedStories: syncCompletedStories,
        storyStartTime: syncStoryStartTime,
        players: syncPlayers,
      } = event.payload;

      if (incomingCustomHost) {
        customHostIdRef.current = incomingCustomHost;
        roomStateRef.current.customHostId = incomingCustomHost;
        setHostId(incomingCustomHost);
        hostIdRef.current = incomingCustomHost;
        updatePresence(incomingCustomHost);
      }

      if (hostIdRef.current === myUserId) return;

      setIsRevealed(syncIsRevealed);
      setVotesSnapshot(syncVotesSnapshot || null);
      setActiveStory(syncActiveStory);
      setCompletedStories(syncCompletedStories);
      setStoryStartTime(syncStoryStartTime);
      roomStateRef.current.storyStartTime = syncStoryStartTime;

      if (syncPlayers) {
        setPlayers((prev) => prev.map((p) => {
          const syncedPlayer = syncPlayers.find((sp) => sp.id === p.id);
          return syncedPlayer ? { ...p, selectedCard: syncedPlayer.selectedCard } : p;
        }));
      }
    };

    const handleKickPlayer = (event: RealtimeEvent<KickPlayerPayload>) => {
      const { playerId } = event.payload;
      exitedHostsRef.current[playerId] = Date.now();
      kickedUserIdsRef.current.add(playerId);
      if (customHostIdRef.current === playerId) {
        customHostIdRef.current = null;
        roomStateRef.current.customHostId = null;
      }
      if (playerId === myUserId) {
        setIsKicked(true);
        if (channelRef.current) {
          channelRef.current.untrack().catch(() => {});
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
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
      .on("broadcast", { event: "promote_host" }, (event: RealtimeEvent<PromoteHostPayload>) => handlePromoteHostRef.current(event))
      .on("broadcast", { event: "kick_player" }, handleKickPlayer)
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          updatePresence();
          roomChannel.send({ type: "broadcast", event: "request_sync", payload: {} });
        } else {
          isSubscribedRef.current = false;
        }
      });

    return () => {
      broadcastLeave();
      isSubscribedRef.current = false;
      if (channelRef.current) {
        const currentChannel = channelRef.current;
        channelRef.current = null;
        currentChannel.untrack().finally(() => {
          supabase.removeChannel(currentChannel);
        });
      }
    };
  }, [roomId]);

  const kickPlayer = useCallback(async (playerId: string) => {
    exitedHostsRef.current[playerId] = Date.now();
    kickedUserIdsRef.current.add(playerId);
    if (customHostIdRef.current === playerId) {
      customHostIdRef.current = null;
      roomStateRef.current.customHostId = null;
    }
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "kick_player",
        payload: { playerId },
      });
    }
  }, [setPlayers]);

  const promotePlayer = useCallback(async (playerId: string) => {
    const targetPlayer = playersRef.current.find((p) => p.id === playerId);
    const username = targetPlayer?.name;

    handlePromoteHost({ payload: { hostId: playerId, username } });

    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "promote_host",
        payload: { hostId: playerId, username },
      });
    }
  }, [handlePromoteHost]);

  const endSession = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "session_ended",
        payload: {},
      });
    }
    await leaveRoom();
  }, [leaveRoom]);

  return {
    channelRef,
    updatePresence,
    roomStateRef,
    leaveRoom,
    isKicked,
    kickPlayer,
    promotePlayer,
    isSessionEnded,
    endSession,
    kickedUserIdsRef,
  };
};