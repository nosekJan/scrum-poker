import { useState, useEffect, useCallback } from "react";
import { myUserId } from "../utils/poker";
import { usePokerStories } from "./usePokerStories";
import { usePokerChannel } from "./usePokerChannel";
import type { Player, CardValue } from "../types/poker";

export { myUserId, formatTime } from "../utils/poker";

export const usePokerGame = (roomId: string, playerName: string, onLeave: () => void) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);

  const {
    activeStory,
    setActiveStory,
    completedStories,
    setCompletedStories,
    storyStartTime,
    setStoryStartTime,
    saveStoryToDB,
    deleteStoryFromDB
  } = usePokerStories(roomId);

  const { channelRef, updatePresence } = usePokerChannel({
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
  });

  const toggleReveal = useCallback((reveal: boolean) => {
    setIsRevealed(reveal);
    if (!reveal && channelRef.current) {
      setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
      updatePresence({ selectedCard: null });
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "reveal_state",
        payload: { isRevealed: reveal },
      });
    }
  }, [channelRef, updatePresence]);

  const castVote = (card: CardValue | null) => {
    setPlayers((prev) => prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p)));
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "vote",
        payload: { userId: myUserId, card },
      });
      updatePresence({ selectedCard: card });
    }
  };

  const startStoryGrooming = (title: string) => {
    setActiveStory(title);
    const startTime = Date.now();
    setStoryStartTime(startTime);
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "story_state",
        payload: { activeStory: title, completedStories, storyStartTime: startTime, resetVotes: false },
      });
    }
  };

  const saveAndNextStory = async (estimate: string) => {
    const updatedCompleted = await saveStoryToDB(estimate);
    if (!updatedCompleted) return;
    setIsRevealed(false);
    setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
    if (channelRef.current) {
      updatePresence({ selectedCard: null });
      channelRef.current.send({
        type: "broadcast",
        event: "story_state",
        payload: { activeStory: null, completedStories: updatedCompleted, storyStartTime: null, resetVotes: true },
      });
    }
  };

  const triggerRevote = () => {
    setIsRevealed(false);
    setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
    if (channelRef.current) {
      updatePresence({ selectedCard: null });
      channelRef.current.send({ type: "broadcast", event: "revote", payload: {} });
    }
  };

  const deleteStory = async (storyId: string) => {
    const updatedCompleted = await deleteStoryFromDB(storyId);
    if (!updatedCompleted) return;
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "story_state",
        payload: { activeStory, completedStories: updatedCompleted, storyStartTime, resetVotes: false },
      });
    }
  };

  const endSession = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "session_ended",
        payload: {},
      });
    }
    setTimeout(() => {
      onLeave();
    }, 100);
  };

  useEffect(() => {
    if (!isRevealed && players.length > 0) {
      const allVoted = players.every((p) => p.selectedCard !== null);
      if (allVoted) {
        toggleReveal(true);
      }
    }
  }, [players, isRevealed, toggleReveal]);

  return {
    players,
    castVote,
    isRevealed,
    toggleReveal,
    activeStory,
    completedStories,
    startStoryGrooming,
    saveAndNextStory,
    triggerRevote,
    storyStartTime,
    deleteStory,
    hostId,
    endSession,
  };
};