import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  KickPlayerPayload,
  PromoteHostPayload,
  PlayerLeavingPayload,
} from "../types/poker";

export const sendKickPlayer = async (
  channel: RealtimeChannel | null,
  playerId: string
): Promise<void> => {
  if (!channel) return;
  await channel.send({
    type: "broadcast",
    event: "kick_player",
    payload: { playerId } as KickPlayerPayload,
  });
};

export const sendPromoteHost = async (
  channel: RealtimeChannel | null,
  hostId: string,
  username?: string
): Promise<void> => {
  if (!channel) return;
  await channel.send({
    type: "broadcast",
    event: "promote_host",
    payload: { hostId, username } as PromoteHostPayload,
  });
};

export const sendSessionEnded = async (
  channel: RealtimeChannel | null
): Promise<void> => {
  if (!channel) return;
  await channel.send({
    type: "broadcast",
    event: "session_ended",
    payload: {},
  });
};

export const sendPlayerLeaving = (
  channel: RealtimeChannel | null,
  userId: string,
  isSubscribed: boolean
): void => {
  if (!channel || !isSubscribed) return;
  channel.send({
    type: "broadcast",
    event: "player_leaving",
    payload: { userId, timestamp: Date.now() } as PlayerLeavingPayload,
  });
};