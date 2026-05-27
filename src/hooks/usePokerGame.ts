import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Player, CardValue, Story } from '../types/poker';

const getUserId = () => {
  let id = sessionStorage.getItem('poker_user_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('poker_user_id', id);
  }
  return id;
};

export const myUserId = getUserId();

// 🔥 Helper na formátovanie času do histórie
export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const usePokerGame = (roomId: string, playerName: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [completedStories, setCompletedStories] = useState<Story[]>([]);
  const [storyStartTime, setStoryStartTime] = useState<number | null>(null); // 🔥 NOVÉ
  
  const channelRef = useRef<any>(null);

  const roomStateRef = useRef({ isRevealed, activeStory, completedStories, storyStartTime });
  useEffect(() => {
    roomStateRef.current = { isRevealed, activeStory, completedStories, storyStartTime };
  }, [isRevealed, activeStory, completedStories, storyStartTime]);

  useEffect(() => {
    // 🔥 Načítanie simulovanej perzistencie (z localStorage)
    const savedHistory = localStorage.getItem(`poker_history_${roomId}`);
    if (savedHistory) {
      setCompletedStories(JSON.parse(savedHistory));
    }

    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: { presence: { key: myUserId } },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        setPlayers((prevPlayers) => {
          const activePlayers: Player[] = [];
          for (const [key, presenceArray] of Object.entries(state)) {
            const presenceData = (presenceArray as any[])[0];
            const existingPlayer = prevPlayers.find(p => p.id === key);
            const currentCard = existingPlayer && existingPlayer.selectedCard !== null 
              ? existingPlayer.selectedCard 
              : (presenceData.selectedCard || null);

            activePlayers.push({
              id: key,
              name: presenceData.name,
              selectedCard: currentCard,
            });
          }
          activePlayers.sort((a, b) => a.name.localeCompare(b.name));
          return activePlayers;
        });
      })
      .on('broadcast', { event: 'vote' }, (payload) => {
        const { userId, card } = payload.payload;
        setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p)));
      })
      .on('broadcast', { event: 'reveal_state' }, async (payload) => {
         const reveal = payload.payload.isRevealed;
         setIsRevealed(reveal);
         if (!reveal && roomChannel.state === 'joined') {
             await roomChannel.track({ name: playerName, selectedCard: null });
         }
      })
      .on('broadcast', { event: 'story_state' }, (payload) => {
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime); // 🔥 Syncujeme čas
        if (payload.payload.resetVotes) {
          setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
        }
      })
      // 🔥 NOVÉ: Odchytávame Re-Vote
      .on('broadcast', { event: 'revote' }, async () => {
        setIsRevealed(false);
        setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
        if (roomChannel.state === 'joined') {
          await roomChannel.track({ name: playerName, selectedCard: null });
        }
      })
      .on('broadcast', { event: 'request_sync' }, () => {
        const state = roomChannel.presenceState();
        const sortedIds = Object.keys(state).sort();
        if (sortedIds[0] === myUserId) {
          roomChannel.send({ type: 'broadcast', event: 'sync_response', payload: roomStateRef.current });
        }
      })
      .on('broadcast', { event: 'sync_response' }, (payload) => {
        setIsRevealed(payload.payload.isRevealed);
        setActiveStory(payload.payload.activeStory);
        setCompletedStories(payload.payload.completedStories);
        setStoryStartTime(payload.payload.storyStartTime);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ name: playerName, selectedCard: null });
          await roomChannel.send({ type: 'broadcast', event: 'request_sync', payload: {} });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
      channelRef.current = null;
    };
  }, [roomId, playerName]);

  const toggleReveal = useCallback(async (reveal: boolean) => {
    setIsRevealed(reveal);
    if (!reveal && channelRef.current) {
        setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
        await channelRef.current.track({ name: playerName, selectedCard: null });
    }
    if (channelRef.current) {
       await channelRef.current.send({ type: 'broadcast', event: 'reveal_state', payload: { isRevealed: reveal } });
    }
  }, [playerName]);

  const castVote = async (card: CardValue | null) => {
    setPlayers((prev) => prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p)));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'vote', payload: { userId: myUserId, card } });
      channelRef.current.track({ name: playerName, selectedCard: card });
    }
  };

  const startStoryGrooming = async (title: string) => {
    setActiveStory(title);
    const startTime = Date.now();
    setStoryStartTime(startTime);
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'story_state',
        payload: { activeStory: title, completedStories, storyStartTime: startTime, resetVotes: false },
      });
    }
  };

  const saveAndNextStory = async (estimate: string) => {
    if (!activeStory) return;
    
    // Zistíme finálny čas
    const finalTime = storyStartTime ? formatTime(Date.now() - storyStartTime) : '00:00';
    
    const newStory: Story = {
      id: Math.random().toString(36).substring(2, 9),
      title: activeStory,
      estimate,
      time: finalTime,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedCompleted = [newStory, ...completedStories];
    setCompletedStories(updatedCompleted);
    setActiveStory(null);
    setStoryStartTime(null);
    setIsRevealed(false);
    setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
    
    // 🔥 Uloženie do pamäte prehliadača (krok pred databázou)
    localStorage.setItem(`poker_history_${roomId}`, JSON.stringify(updatedCompleted));

    if (channelRef.current) {
      await channelRef.current.track({ name: playerName, selectedCard: null });
      await channelRef.current.send({
        type: 'broadcast',
        event: 'story_state',
        payload: { activeStory: null, completedStories: updatedCompleted, storyStartTime: null, resetVotes: true },
      });
    }
  };

  // 🔥 NOVÉ: Vyvolanie Re-vote
  const triggerRevote = async () => {
    setIsRevealed(false);
    setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
    if (channelRef.current) {
      await channelRef.current.track({ name: playerName, selectedCard: null });
      await channelRef.current.send({ type: 'broadcast', event: 'revote', payload: {} });
    }
  };

  useEffect(() => {
    if (!isRevealed && players.length > 0) {
      const allVoted = players.every(p => p.selectedCard !== null);
      if (allVoted) {
        toggleReveal(true);
      }
    }
  }, [players, isRevealed, toggleReveal]);

  return { players, castVote, isRevealed, toggleReveal, activeStory, completedStories, startStoryGrooming, saveAndNextStory, triggerRevote, storyStartTime };
};