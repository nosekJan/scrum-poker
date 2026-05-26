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
      // 1. Zisťujeme KTO tu je
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const currentPlayers: Player[] = [];

        for (const [key, presenceArray] of Object.entries(state)) {
          const presenceData = (presenceArray as any[])[0];
          // Pridáme len ak tento hráč ešte v zozname nie je, inak si pamätáme jeho aktuálnu kartu
          setPlayers((prev) => {
            const existing = prev.find(p => p.id === key);
            return existing ? prev : [...prev, { id: key, name: presenceData.name, selectedCard: null }];
          });
        }
      })
      // 2. Počúvame bleskové správy z "vysielačky" (Broadcast)
      .on('broadcast', { event: 'vote' }, (payload) => {
        const { userId, card } = payload.payload;
        // Aktualizujeme stav hráča na zeleno, hneď ako to počujeme
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

  // 3. Namiesto trackovania teraz hlas KRIČÍME do vysielačky
  const castVote = async (card: CardValue | null) => {
    // Najprv si to okamžite zmeníme my u seba (lokálne)
    setPlayers((prev) =>
      prev.map((p) => (p.id === myUserId ? { ...p, selectedCard: card } : p))
    );

    // A potom to pošleme ostatným
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