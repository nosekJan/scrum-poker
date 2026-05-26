import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../types/poker';

const myUserId = Math.random().toString(36).substring(2, 10);

export const usePokerGame = (roomId: string, playerName: string) => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: myUserId,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const currentPlayers: Player[] = [];

        for (const [key, presenceArray] of Object.entries(state)) {
          // Oprava chyby 2: Explicitne povieme TS, že presenceArray je pole
          const typedPresenceArray = presenceArray as any[];
          const presenceData = typedPresenceArray[0];
          
          currentPlayers.push({
            id: key,
            name: presenceData.name,
            selectedCard: presenceData.selectedCard || null,
          });
        }
        
        setPlayers(currentPlayers);
      })
      // Oprava chyby 3: Definovali sme, že status je string
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            name: playerName,
            selectedCard: null,
          });
        }
      });

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, playerName]);

  return { players };
};