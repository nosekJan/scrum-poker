import { useEffect, useState, useRef } from 'react';
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
            
            // Preferujeme okamžitý lokálny stav (aby to nepreblikovalo), inak berieme z Presence
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

  const castVote = async (card: CardValue | null) => {
    // 1. Okamžitá lokálna zmena (Optimistic UI)
    setPlayers((prev) =>
      prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p))
    );

    if (channelRef.current) {
      // 2. Bleskový Broadcast pre kolegov online
      channelRef.current.send({
        type: 'broadcast',
        event: 'vote',
        payload: { userId: myUserId, card },
      });

      // 3. Track pre perzistenciu (pre tých, čo sa pripoja neskôr)
      channelRef.current.track({ name: playerName, selectedCard: card });
    }
  };

  const toggleReveal = async (reveal: boolean) => {
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
  };

  return { players, castVote, isRevealed, toggleReveal };
};