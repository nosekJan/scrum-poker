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
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: { key: myUserId },
      },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const currentPlayers: Player[] = [];

        for (const [key, presenceArray] of Object.entries(state)) {
          const presenceData = (presenceArray as any[])[0];
          currentPlayers.push({
            id: key,
            name: presenceData.name,
            selectedCard: presenceData.selectedCard || null,
          });
        }
        
        setPlayers(currentPlayers);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            name: playerName,
            selectedCard: null,
          });
        }
      });

    return () => {
      // 🔥 OPRAVA: Okamžité synchrónne odstránenie kanálu. 
      // Supabase sa o odhlásenie na pozadí postará sám a Strict Mode už nebude padať.
      supabase.removeChannel(roomChannel);
      channelRef.current = null;
    };
  }, [roomId, playerName]);

  const castVote = async (card: CardValue | null) => {
    if (channelRef.current) {
      await channelRef.current.track({
        name: playerName,
        selectedCard: card,
      });
    }
  };

  return { players, castVote };
};