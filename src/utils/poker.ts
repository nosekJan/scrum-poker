import type { Player } from "../types/poker";

export const getUserId = () => {
  let id = localStorage.getItem("poker_user_id");
  if (!id) {
    id = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("poker_user_id", id);
  }
  return id;
};

export const myUserId = getUserId();

export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/* --- REFACTORING HELPERS --- */

export const PLAYER_EMOJIS = [
  "🦊", "🐰", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵", "🦉", "🦄",
  "🐙", "🦖", "🦥", "🦦", "👽", "🤖", "👻", "🦫", "🦩", "🐢",
  "🐶", "🐱", "🐭", "🐹", "🐻", "🐷", "🐮", "🐔", "🐧", "🐦",
  "🐤", "🦆", "🦅", "🦇", "🐺", "🐗", "🐴", "🐝", "🦋", "🐌",
  "🐞", "🐜", "🦂", "🕷️", "🐒", "🦍", "🦧", "🐕", "🐈", "🐆",
];

export interface VoteStat {
  card: string;
  count: number;
  percentage: number;
}

export interface TieInfo {
  isTie: boolean;
  lowest: string;
  highest: string;
}

/**
 * Generuje deterministické mapovanie emodži pre hráčov
 */
export function getPlayerEmojiMapping(players: Player[]): Record<string, string> {
  const sortedPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));
  const mapping: Record<string, string> = {};
  const usedEmojis = new Set<string>();

  sortedPlayers.forEach((player) => {
    const seedSource = (player as Player & { emojiSeed?: string }).emojiSeed?.toString() || player.id;

    let hash = 0;
    for (let i = 0; i < seedSource.length; i++) {
      hash = seedSource.charCodeAt(i) + ((hash << 5) - hash);
    }

    let baseIndex = Math.abs(hash) % PLAYER_EMOJIS.length;
    let chosenEmoji = PLAYER_EMOJIS[baseIndex];
    let attempts = 0;

    while (usedEmojis.has(chosenEmoji) && attempts < PLAYER_EMOJIS.length) {
      baseIndex = (baseIndex + 1) % PLAYER_EMOJIS.length;
      chosenEmoji = PLAYER_EMOJIS[baseIndex];
      attempts++;
    }

    if (attempts >= PLAYER_EMOJIS.length) {
      baseIndex = Math.abs(hash) % PLAYER_EMOJIS.length;
      chosenEmoji = PLAYER_EMOJIS[baseIndex];
    }

    mapping[player.id] = chosenEmoji;
    usedEmojis.add(chosenEmoji);
  });

  return mapping;
}

/**
 * Vypočíta matematický priemer hlasov
 */
export function calculateAverage(players: Player[]): string {
  const validVotes = players
    .map((p) => parseFloat(p.selectedCard as string))
    .filter((v) => !isNaN(v));

  if (validVotes.length === 0) {
    const hasCoffee = players.some((p) => p.selectedCard === "☕");
    return hasCoffee ? "☕" : "—";
  }

  return (
    validVotes.reduce((acc, curr) => acc + curr, 0) / validVotes.length
  ).toFixed(1);
}

/**
 * Spočíta distribučné štatistiky kariet
 */
export function calculateVoteStats(
  players: Player[],
  isRevealed: boolean
): VoteStat[] {
  if (!isRevealed) return [];
  const stats: Record<string, number> = {};
  let totalVotes = 0;

  players.forEach((p) => {
    if (p.selectedCard) {
      stats[p.selectedCard] = (stats[p.selectedCard] || 0) + 1;
      totalVotes++;
    }
  });

  if (totalVotes === 0) return [];

  return Object.entries(stats)
    .map(([card, count]) => ({
      card,
      count,
      percentage: Math.round((count / totalVotes) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Vyhodnotí remízu (Tie-break)
 */
export function calculateTieInfo(
  voteStats: VoteStat[],
  averageStr: string
): TieInfo {
  if (voteStats.length === 0)
    return { isTie: false, lowest: "", highest: "" };

  const maxCount = voteStats[0].count;
  const topCards = voteStats
    .filter((s) => s.count === maxCount)
    .map((s) => s.card);

  if (topCards.length < 2) {
    return { isTie: false, lowest: topCards[0], highest: topCards[0] };
  }

  const numAverage = parseFloat(averageStr);
  if (isNaN(numAverage)) {
    const sorted = [...topCards].sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
    return {
      isTie: true,
      lowest: sorted[0],
      highest: sorted[sorted.length - 1],
    };
  }

  const numericCards = topCards
    .map((c) => ({ string: c, number: parseFloat(c) }))
    .filter((c) => !isNaN(c.number));

  const belowOrEqual = numericCards.filter((c) => c.number <= numAverage);
  const aboveOrEqual = numericCards.filter((c) => c.number >= numAverage);

  let smartLower = "";
  let smartHigher = "";

  if (belowOrEqual.length > 0) {
    belowOrEqual.sort((a, b) => b.number - a.number);
    smartLower = belowOrEqual[0].string;
  } else {
    const sorted = [...numericCards].sort((a, b) => a.number - b.number);
    smartLower = sorted[0].string;
  }

  if (aboveOrEqual.length > 0) {
    aboveOrEqual.sort((a, b) => a.number - b.number);
    smartHigher = aboveOrEqual[0].string;
  } else {
    const sorted = [...numericCards].sort((a, b) => b.number - a.number);
    smartHigher = sorted[0].string;
  }

  if (smartLower === smartHigher) {
    return { isTie: false, lowest: smartLower, highest: smartHigher };
  }

  return {
    isTie: true,
    lowest: smartLower,
    highest: smartHigher,
  };
}