import type { RefObject, Dispatch, SetStateAction } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type {
  Player,
  Story,
  PresencePayload,
  RoomState,
  VotePayload,
  RevealStatePayload,
  StoryStatePayload,
  RevotePayload,
  PlayerLeavingPayload,
  SyncResponsePayload,
  KickPlayerPayload,
  PromoteHostPayload,
  RealtimeEvent,
} from "../types/poker";

export const handleVoteEvent = (
  event: RealtimeEvent<VotePayload>,
  setPlayers: Dispatch<SetStateAction<Player[]>>
): void => {
  const { userId, card } = event.payload;
  setPlayers((prev) =>
    prev.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p))
  );
};

export const handleRevealStateEvent = (
  event: RealtimeEvent<RevealStatePayload>,
  setIsRevealed: Dispatch<SetStateAction<boolean>>,
  setVotesSnapshot: Dispatch<SetStateAction<Player[] | null>>
): void => {
  const { isRevealed: reveal, votesSnapshot: snapshot } = event.payload;
  setIsRevealed(reveal);
  if (reveal) {
    setVotesSnapshot(snapshot || null);
  } else {
    setVotesSnapshot(null);
  }
};

export const handleStoryStateEvent = (
  event: RealtimeEvent<StoryStatePayload>,
  setActiveStory: Dispatch<SetStateAction<string | null>>,
  setCompletedStories: Dispatch<SetStateAction<Story[]>>,
  setStoryStartTime: Dispatch<SetStateAction<number | null>>,
  roomStateRef: RefObject<RoomState>,
  setPlayers: Dispatch<SetStateAction<Player[]>>,
  setIsRevealed: Dispatch<SetStateAction<boolean>>,
  setVotesSnapshot: Dispatch<SetStateAction<Player[] | null>>
): void => {
  const { activeStory, completedStories, storyStartTime, resetVotes } =
    event.payload;
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

export const handleRevoteEvent = (
  event: RealtimeEvent<RevotePayload>,
  setIsRevealed: Dispatch<SetStateAction<boolean>>,
  setVotesSnapshot: Dispatch<SetStateAction<Player[] | null>>,
  setStoryStartTime: Dispatch<SetStateAction<number | null>>,
  roomStateRef: RefObject<RoomState>,
  setPlayers: Dispatch<SetStateAction<Player[]>>
): void => {
  const { storyStartTime } = event.payload;
  setIsRevealed(false);
  setVotesSnapshot(null);
  setStoryStartTime(storyStartTime || null);
  roomStateRef.current.storyStartTime = storyStartTime || null;
  setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
};

export const handlePlayerLeavingEvent = (
  event: RealtimeEvent<PlayerLeavingPayload>,
  exitedHostsRef: RefObject<Record<string, number>>,
  setPlayers: Dispatch<SetStateAction<Player[]>>,
  customHostIdRef: RefObject<string | null>,
  roomStateRef: RefObject<RoomState>,
  setHostId: Dispatch<SetStateAction<string | null>>,
  playersRef: RefObject<Player[]>,
  hostIdRef: RefObject<string | null>
): void => {
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

export const handleKickPlayerEvent = (
  event: RealtimeEvent<KickPlayerPayload>,
  myUserId: string,
  exitedHostsRef: RefObject<Record<string, number>>,
  kickedUserIdsRef: RefObject<Set<string>>,
  customHostIdRef: RefObject<string | null>,
  roomStateRef: RefObject<RoomState>,
  setIsKicked: Dispatch<SetStateAction<boolean>>,
  channelRef: RefObject<RealtimeChannel | null>,
  setPlayers: Dispatch<SetStateAction<Player[]>>
): void => {
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

export const handleSyncResponseEvent = (
  event: RealtimeEvent<SyncResponsePayload>,
  myUserId: string,
  customHostIdRef: RefObject<string | null>,
  roomStateRef: RefObject<RoomState>,
  setHostId: Dispatch<SetStateAction<string | null>>,
  hostIdRef: RefObject<string | null>,
  updatePresence: (nextHostId?: string | null) => void,
  setIsRevealed: Dispatch<SetStateAction<boolean>>,
  setVotesSnapshot: Dispatch<SetStateAction<Player[] | null>>,
  setActiveStory: Dispatch<SetStateAction<string | null>>,
  setCompletedStories: Dispatch<SetStateAction<Story[]>>,
  setStoryStartTime: Dispatch<SetStateAction<number | null>>,
  setPlayers: Dispatch<SetStateAction<Player[]>>
): void => {
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
    setPlayers((prev) =>
      prev.map((p) => {
        const syncedPlayer = syncPlayers.find((sp) => sp.id === p.id);
        return syncedPlayer
          ? { ...p, selectedCard: syncedPlayer.selectedCard }
          : p;
      })
    );
  }
};

export const handlePresenceSyncEvent = (
  channel: RealtimeChannel,
  exitedHostsRef: RefObject<Record<string, number>>,
  customHostIdRef: RefObject<string | null>,
  roomStateRef: RefObject<RoomState>,
  setHostId: Dispatch<SetStateAction<string | null>>,
  hostIdRef: RefObject<string | null>,
  setPlayers: Dispatch<SetStateAction<Player[]>>
): void => {
  const state = channel.presenceState();
  let oldestTime = Infinity;
  let defaultHostId: string | null = null;
  const activePlayersMap: Record<string, PresencePayload> = {};
  let presenceCustomHostId: string | null = null;

  for (const [key, rawPresenceArray] of Object.entries(state)) {
    const presenceArray = rawPresenceArray as unknown as PresencePayload[];
    if (!Array.isArray(presenceArray) || presenceArray.length === 0) continue;

    const sortedPresence = [...presenceArray].sort(
      (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0)
    );
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

  const currentCustomHost =
    presenceCustomHostId ||
    customHostIdRef.current ||
    roomStateRef.current.customHostId;
  const isCustomHostExited = Boolean(
    currentCustomHost && exitedHostsRef.current[currentCustomHost]
  );

  if (isCustomHostExited) {
    customHostIdRef.current = null;
  } else if (currentCustomHost) {
    customHostIdRef.current = currentCustomHost;
  }

  roomStateRef.current.customHostId = customHostIdRef.current;

  const finalHostId =
    customHostIdRef.current && activeKeys.includes(customHostIdRef.current)
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

export const handleSessionEndedEvent = (
  myUserId: string,
  kickedUserIdsRef: RefObject<Set<string>>,
  setIsSessionEnded: Dispatch<SetStateAction<boolean>>,
  channelRef: RefObject<RealtimeChannel | null>
): void => {
  if (kickedUserIdsRef.current.has(myUserId)) return;
  setIsSessionEnded(true);
  if (channelRef.current) {
    channelRef.current.untrack().catch(() => {});
    supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  }
};

export const handleRequestSyncEvent = (
  channel: RealtimeChannel,
  myUserId: string,
  hostIdRef: RefObject<string | null>,
  customHostIdRef: RefObject<string | null>,
  roomStateRef: RefObject<RoomState>
): void => {
  const activeCustomHost =
    customHostIdRef.current || roomStateRef.current.customHostId;
  const isCurrentHost = hostIdRef.current === myUserId;

  if (isCurrentHost) {
    roomStateRef.current.customHostId = activeCustomHost;
    channel.send({
      type: "broadcast",
      event: "sync_response",
      payload: roomStateRef.current,
    });
  }
};

export const handlePromoteHostEvent = (
  event: RealtimeEvent<PromoteHostPayload>,
  customHostIdRef: RefObject<string | null>,
  roomStateRef: RefObject<RoomState>,
  setHostId: Dispatch<SetStateAction<string | null>>,
  hostIdRef: RefObject<string | null>,
  updatePresence: (nextHostId?: string | null) => void,
  playersRef: RefObject<Player[]>,
  addNotificationRef: RefObject<
    ((type: "join" | "leave" | "kick" | "promote", username: string) => void) | undefined
  >
): void => {
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
};
