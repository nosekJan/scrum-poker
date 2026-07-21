import { usePoker } from "./usePoker";
import { myUserId } from "./usePokerGame";

export const useCurrentPlayer = () => {
  const { players } = usePoker();
  return players.find((p) => p.id === myUserId) ?? null;
};