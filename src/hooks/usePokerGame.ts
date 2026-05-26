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
        
        // 🔥 OPRAVA: Prestavíme celé pole presne podľa toho, kto je reálne v roomke
        setPlayers((prev) => {
          const activePlayers: Player[] = [];
          
          for (const [key, presenceArray] of Object.entries(state)) {
            const presenceData = (presenceArray as any[])[0];
            const existingPlayer = prev.find(p => p.id === key);
            
            activePlayers.push({
              id: key,
              name: presenceData.name,
              // Ak tu už hráč bol, necháme mu jeho kartu, inak null
              selectedCard: existingPlayer ? existingPlayer.selectedCard : null,
            });
          }
          
          return activePlayers; // Vraciame IBA aktívnych hráčov, tí čo odišli, tu nebudú
        });
      })
      .on('broadcast', { event: 'vote' }, (payload) => {
        const { userId, card } = payload.payload;
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) => (p.id === userId ? { ...p, selectedCard: card } : p))
        );
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ name: playerName });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
      channelRef.current = null;
    };
  }, [roomId, playerName]);

  const castVote = async (card: CardValue | null) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p))
    );

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'vote',
        payload: { userId: myUserId, card },
      });
    }
  };

  return { players, castVote };
};