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
  hostIdRef: RefObject<string | null>,
  updatePresence?: (nextCustomHostId?: string | null) => void
): void => {
  const { userId, timestamp } = event.payload;
  exitedHostsRef.current[userId] = timestamp || Date.now();
  setPlayers((prev) => prev.filter((p) => p.id !== userId));

  const isHostLeaving =
    hostIdRef.current === userId || customHostIdRef.current === userId;

  if (isHostLeaving) {
    const remaining = playersRef.current.filter((p) => p.id !== userId);
    const nextHostId =
      remaining.length > 0
        ? [...remaining].sort((a, b) => a.joinedAt - b.joinedAt)[0].id
        : null;

    hostIdRef.current = nextHostId;
    customHostIdRef.current = nextHostId;
    roomStateRef.current.customHostId = nextHostId;
    setHostId(nextHostId);

    if (updatePresence) {
      updatePresence(nextHostId);
    }
  }
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
  setPlayers: Dispatch<SetStateAction<Player[]>>,
  kickedUserIdsRef: RefObject<Set<string>>
): void => {
  const {
    customHostId: incomingCustomHost,
    isRevealed: syncIsRevealed,
    votesSnapshot: syncVotesSnapshot,
    activeStory: syncActiveStory,
    completedStories: syncCompletedStories,
    storyStartTime: syncStoryStartTime,
    players: syncPlayers,
    kickedUserIds: syncKickedUserIds,
  } = event.payload;

 if (syncKickedUserIds && Array.isArray(syncKickedUserIds) && kickedUserIdsRef.current) {
    syncKickedUserIds.forEach((id) => {
      if (id !== myUserId) {
        kickedUserIdsRef.current.add(id);
      }
    });
  }
  if (incomingCustomHost && !customHostIdRef.current) {
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
  const foundCustomHosts: string[] = [];

  for (const [key, rawPresenceArray] of Object.entries(state)) {
    const presenceArray = rawPresenceArray as unknown as PresencePayload[];
    if (!Array.isArray(presenceArray) || presenceArray.length === 0) continue;

    const sortedPresence = [...presenceArray].sort(
      (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0)
    );
    const playerData = sortedPresence[0];
    if (!playerData) continue;

    const exitTime = exitedHostsRef.current[key];
    if (exitTime) {
      if ((playerData.joinedAt || 0) <= exitTime) {
        continue;
      }
      delete exitedHostsRef.current[key];
    }

    if (playerData.customHostId) {
      foundCustomHosts.push(playerData.customHostId);
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

  let validCustomHost: string | null = null;

  if (customHostIdRef.current && activeKeys.includes(customHostIdRef.current)) {
    validCustomHost = customHostIdRef.current;
  } else if (
    roomStateRef.current.customHostId &&
    activeKeys.includes(roomStateRef.current.customHostId)
  ) {
    validCustomHost = roomStateRef.current.customHostId;
  } else {
    validCustomHost =
      foundCustomHosts.find((id) => activeKeys.includes(id)) || null;
  }

  customHostIdRef.current = validCustomHost;
  roomStateRef.current.customHostId = validCustomHost;

  const finalHostId = validCustomHost || defaultHostId;

  console.log(`[DEBUG][handlePresenceSyncEvent] ${JSON.stringify({
    activeKeys,
    foundCustomHosts,
    customHostIdRef: customHostIdRef.current,
    defaultHostId,
    finalHostId
  }, null, 2)}`);

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
  roomStateRef: RefObject<RoomState>,
  kickedUserIdsRef: RefObject<Set<string>>
): void => {
  const activeCustomHost =
    customHostIdRef.current || roomStateRef.current.customHostId;
  const isCurrentHost = hostIdRef.current === myUserId;

  if (isCurrentHost) {
    roomStateRef.current.customHostId = activeCustomHost;
    channel.send({
      type: "broadcast",
      event: "sync_response",
      payload: {
        ...roomStateRef.current,
        kickedUserIds: kickedUserIdsRef.current
          ? Array.from(kickedUserIdsRef.current)
          : [],
      },
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
  console.log(`[DEBUG][handlePromoteHostEvent] ${JSON.stringify({
    nextHostId,
    username,
    currentHostId: hostIdRef.current
  }, null, 2)}`);
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
