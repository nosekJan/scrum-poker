import { useEffect, useRef, useCallback, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { myUserId } from "../utils/poker";
import {
  sendKickPlayer,
  sendPromoteHost,
  sendSessionEnded,
  sendPlayerLeaving,
} from "../utils/pokerChannelActions";
import {
  handleVoteEvent,
  handleRevealStateEvent,
  handleStoryStateEvent,
  handleRevoteEvent,
  handlePlayerLeavingEvent,
  handleKickPlayerEvent,
  handleSyncResponseEvent,
  handlePresenceSyncEvent,
  handleSessionEndedEvent,
  handleRequestSyncEvent,
  handlePromoteHostEvent,
} from "../utils/pokerEventHandlers";
import type {
  Player,
  Story,
  VotePayload,
  RevealStatePayload,
  StoryStatePayload,
  RevotePayload,
  PlayerLeavingPayload,
  SyncResponsePayload,
  PromoteHostPayload,
  KickPlayerPayload,
  RealtimeEvent,
} from "../types/poker";


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
  const joinedAtRef = useRef<number | null>(null);
  joinedAtRef.current ??= Date.now();

  const emojiSeedRef = useRef<number | null>(null);
  emojiSeedRef.current ??= Math.random();
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

  const handlePromoteHost = useCallback(
    (event: RealtimeEvent<PromoteHostPayload>) => {
      handlePromoteHostEvent(
        event,
        customHostIdRef,
        roomStateRef,
        setHostId,
        hostIdRef,
        updatePresence,
        playersRef,
        addNotificationRef
      );
    },
    [setHostId, updatePresence]
  );

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
    sendPlayerLeaving(channelRef.current, myUserId, isSubscribedRef.current);
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

    roomChannel
      .on("presence", { event: "sync" }, () =>
        handlePresenceSyncEvent(
          roomChannel,
          exitedHostsRef,
          customHostIdRef,
          roomStateRef,
          setHostId,
          hostIdRef,
          setPlayers
        )
      )
      .on("broadcast", { event: "vote" }, (event: RealtimeEvent<VotePayload>) =>
        handleVoteEvent(event, setPlayers)
      )
      .on("broadcast", { event: "reveal_state" }, (event: RealtimeEvent<RevealStatePayload>) =>
        handleRevealStateEvent(event, setIsRevealed, setVotesSnapshot)
      )
      .on("broadcast", { event: "story_state" }, (event: RealtimeEvent<StoryStatePayload>) =>
        handleStoryStateEvent(
          event,
          setActiveStory,
          setCompletedStories,
          setStoryStartTime,
          roomStateRef,
          setPlayers,
          setIsRevealed,
          setVotesSnapshot
        )
      )
      .on("broadcast", { event: "revote" }, (event: RealtimeEvent<RevotePayload>) =>
        handleRevoteEvent(
          event,
          setIsRevealed,
          setVotesSnapshot,
          setStoryStartTime,
          roomStateRef,
          setPlayers
        )
      )
      .on("broadcast", { event: "player_leaving" }, (event: RealtimeEvent<PlayerLeavingPayload>) =>
        handlePlayerLeavingEvent(
          event,
          exitedHostsRef,
          setPlayers,
          customHostIdRef,
          roomStateRef,
          setHostId,
          playersRef,
          hostIdRef
        )
      )
      .on("broadcast", { event: "host_leaving" }, (event: RealtimeEvent<PlayerLeavingPayload>) =>
        handlePlayerLeavingEvent(
          event,
          exitedHostsRef,
          setPlayers,
          customHostIdRef,
          roomStateRef,
          setHostId,
          playersRef,
          hostIdRef
        )
      )
      .on("broadcast", { event: "session_ended" }, () =>
        handleSessionEndedEvent(
          myUserId,
          kickedUserIdsRef,
          setIsSessionEnded,
          channelRef
        )
      )
      .on("broadcast", { event: "request_sync" }, () =>
        handleRequestSyncEvent(
          roomChannel,
          myUserId,
          hostIdRef,
          customHostIdRef,
          roomStateRef
        )
      )
      .on("broadcast", { event: "sync_response" }, (event: RealtimeEvent<SyncResponsePayload>) =>
        handleSyncResponseEvent(
          event,
          myUserId,
          customHostIdRef,
          roomStateRef,
          setHostId,
          hostIdRef,
          updatePresence,
          setIsRevealed,
          setVotesSnapshot,
          setActiveStory,
          setCompletedStories,
          setStoryStartTime,
          setPlayers
        )
      )
      .on("broadcast", { event: "promote_host" }, (event: RealtimeEvent<PromoteHostPayload>) =>
        handlePromoteHostRef.current(event)
      )
      .on("broadcast", { event: "kick_player" }, (event: RealtimeEvent<KickPlayerPayload>) =>
        handleKickPlayerEvent(
          event,
          myUserId,
          exitedHostsRef,
          kickedUserIdsRef,
          customHostIdRef,
          roomStateRef,
          setIsKicked,
          channelRef,
          setPlayers
        )
      )
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
    await sendKickPlayer(channelRef.current, playerId);
  }, [setPlayers]);

  const promotePlayer = useCallback(async (playerId: string) => {
    const targetPlayer = playersRef.current.find((p) => p.id === playerId);
    const username = targetPlayer?.name;

    handlePromoteHost({ payload: { hostId: playerId, username } });
    await sendPromoteHost(channelRef.current, playerId, username);
  }, [handlePromoteHost]);

  const endSession = useCallback(async () => {
    await sendSessionEnded(channelRef.current);
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