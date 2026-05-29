import { useState, useEffect, useCallback } from "react";
import { myUserId } from "../utils/poker";
import { usePokerStories } from "./usePokerStories";
import { usePokerChannel } from "./usePokerChannel";
import type { Player, CardValue } from "../types/poker";

export { myUserId, formatTime } from "../utils/poker";

export const usePokerGame = (roomId: string, playerName: string, onLeave: () => void) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [votesSnapshot, setVotesSnapshot] = useState<Player[] | null>(null);
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
    votesSnapshot,
    setVotesSnapshot,
    setHostId,
    activeStory,
    setActiveStory,
    completedStories,
    setCompletedStories,
    storyStartTime,
    setStoryStartTime,
  });

  const toggleReveal = useCallback(async (reveal: boolean) => {
    setIsRevealed(reveal);
    let currentSnapshot: Player[] | null = null;

    if (reveal) {
      currentSnapshot = [...players];
      setVotesSnapshot(currentSnapshot);
    } else {
      setVotesSnapshot(null);
      setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
      await updatePresence({ selectedCard: null, voteCastAt: null });
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "reveal_state",
        payload: { isRevealed: reveal, votesSnapshot: currentSnapshot },
      });
    }
  }, [channelRef, updatePresence, players]);

  const castVote = (card: CardValue | null) => {
    if (isRevealed) return;

    setPlayers((prev) => prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p)));
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "vote",
        payload: { userId: myUserId, card },
      });
      updatePresence({ selectedCard: card, voteCastAt: card ? Date.now() : null });
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
    setVotesSnapshot(null);
    setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
    if (channelRef.current) {
      await updatePresence({ selectedCard: null, voteCastAt: null });
      channelRef.current.send({
        type: "broadcast",
        event: "story_state",
        payload: { activeStory: null, completedStories: updatedCompleted, storyStartTime: null, resetVotes: true },
      });
    }
  };

  const triggerRevote = async () => {
    setIsRevealed(false);
    setVotesSnapshot(null);
    setPlayers((prev) => prev.map((p) => ({ ...p, selectedCard: null })));
    const newStartTime = Date.now();
    setStoryStartTime(newStartTime);
    if (channelRef.current) {
      await updatePresence({ selectedCard: null, voteCastAt: null });
      channelRef.current.send({ 
        type: "broadcast", 
        event: "revote", 
        payload: { storyStartTime: newStartTime } 
      });
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
    votesSnapshot,
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