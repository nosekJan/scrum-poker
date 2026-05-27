import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Player, CardValue } from '../types/poker';

const getUserId = () => {
  let id = sessionStorage.getItem('poker_user_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('poker_user_id', id);
  }
  return id;
};

const myUserId = getUserId();

export const usePokerGame = (roomId: string, playerName: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
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
        setPlayers((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p))
        );
      })
      .on('broadcast', { event: 'reveal_state' }, async (payload) => {
         const reveal = payload.payload.isRevealed;
         setIsRevealed(reveal);
         
         if (!reveal) {
             setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
             await roomChannel.track({ name: playerName, selectedCard: null });
         }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ name: playerName, selectedCard: null });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
      channelRef.current = null;
    };
  }, [roomId, playerName]);

  // 🔥 Zabalili sme do useCallback, aby sa dala bezpečne použiť v useEffecte nižšie
  const toggleReveal = useCallback(async (reveal: boolean) => {
    setIsRevealed(reveal);

    if (channelRef.current) {
       if (!reveal) {
           setPlayers(prev => prev.map(p => ({ ...p, selectedCard: null })));
           await channelRef.current.track({ name: playerName, selectedCard: null });
       }

       await channelRef.current.send({
         type: 'broadcast',
         event: 'reveal_state',
         payload: { isRevealed: reveal },
       });
    }
  }, [playerName]);

  const castVote = async (card: CardValue | null) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p))
    );

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'vote',
        payload: { userId: myUserId, card },
      });

      channelRef.current.track({ name: playerName, selectedCard: card });
    }
  };

  // 🔥 NOVINKA: Auto-Reveal Tracker
  useEffect(() => {
    // Ak hra nie je odhalená, máme aspoň jedného hráča a VŠETCI majú vybratú kartu
    if (!isRevealed && players.length > 0) {
      const allVoted = players.every(p => p.selectedCard !== null);
      if (allVoted) {
        toggleReveal(true);
      }
    }
  }, [players, isRevealed, toggleReveal]);

  return { players, castVote, isRevealed, toggleReveal };
};