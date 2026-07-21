import React, { useMemo, useState, useEffect } from "react";
import { usePoker } from "../../hooks/usePoker";
import { myUserId } from "../../hooks/usePokerGame";
import type { Player } from "../../types/poker";

const PLAYER_EMOJIS = [
  "🦊",
  "🐰",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐸",
  "🐵",
  "🦉",
  "🦄",
  "🐙",
  "🦖",
  "🦥",
  "🦦",
  "👽",
  "🤖",
  "👻",
  "🦫",
  "🦩",
  "🐢",
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐻",
  "🐷",
  "🐮",
  "🐔",
  "🐧",
  "🐦",
  "🐤",
  "🦆",
  "🦅",
  "🦇",
  "🐺",
  "🐗",
  "🐴",
  "🐝",
  "🦋",
  "🐌",
  "🐞",
  "🐜",
  "🦂",
  "🕷️",
  "🐒",
  "🦍",
  "🦧",
  "🐕",
  "🐈",
  "🐆",
];

export const PlayerDesk: React.FC = () => {
  const {
    players,
    votesSnapshot,
    isRevealed,
    saveAndNextStory,
    triggerRevote,
    hostId,
    activeStory,
    kickPlayer,
    promotePlayer,
  } = usePoker();

  const [seenDuringReveal, setSeenDuringReveal] = useState<Player[]>([]);

  useEffect(() => {
    if (isRevealed) {
      setSeenDuringReveal((prev) => {
        const newPlayers = players.filter(
          (p) => !prev.some((existing) => existing.id === p.id),
        );
        if (newPlayers.length > 0) {
          return [...prev, ...newPlayers];
        }
        return prev;
      });
    } else {
      setSeenDuringReveal([]);
    }
  }, [isRevealed, players]);

  const isHost = myUserId === hostId;

  const displayedPlayers = useMemo(() => {
    if (isRevealed && votesSnapshot) {
      const base = [...votesSnapshot];

      seenDuringReveal.forEach((seenPlayer) => {
        if (!base.some((b) => b.id === seenPlayer.id)) {
          const activeMatch = players.find((p) => p.id === seenPlayer.id);
          base.push(activeMatch || seenPlayer);
        }
      });
      return base;
    }
    return players;
  }, [isRevealed, votesSnapshot, players, seenDuringReveal]);

  const isCrowded = displayedPlayers.length > 10;

  const playerEmojis = useMemo(() => {
    const sortedPlayers = [...displayedPlayers].sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    const mapping: Record<string, string> = {};
    const usedEmojis = new Set<string>();

    sortedPlayers.forEach((player) => {
      const seedSource = (player as any).emojiSeed?.toString() || player.id;

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
  }, [displayedPlayers]);

  const average = useMemo(() => {
    const validVotes = displayedPlayers
      .map((p) => parseFloat(p.selectedCard as string))
      .filter((v) => !isNaN(v));

    if (validVotes.length === 0) {
      const hasCoffee = displayedPlayers.some((p) => p.selectedCard === "☕");
      return hasCoffee ? "☕" : "—";
    }

    return (
      validVotes.reduce((acc, curr) => acc + curr, 0) / validVotes.length
    ).toFixed(1);
  }, [displayedPlayers]);

  const voteStats = useMemo(() => {
    if (!isRevealed) return [];
    const stats: Record<string, number> = {};
    let totalVotes = 0;
    displayedPlayers.forEach((p) => {
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
  }, [displayedPlayers, isRevealed]);

  const [tiePreference, setTiePreference] = useState<"higher" | "lower">(
    "higher",
  );

  useEffect(() => {
    if (!isRevealed) {
      setTiePreference("higher");
    }
  }, [isRevealed]);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const tieInfo = useMemo(() => {
    if (voteStats.length === 0)
      return { isTie: false, lowest: "", highest: "" };

    const maxCount = voteStats[0].count;
    const topCards = voteStats
      .filter((s) => s.count === maxCount)
      .map((s) => s.card);

    if (topCards.length < 2) {
      return { isTie: false, lowest: topCards[0], highest: topCards[0] };
    }

    const numAverage = parseFloat(average);
    if (isNaN(numAverage)) {
      const sorted = [...topCards].sort(
        (a, b) => parseFloat(a) - parseFloat(b),
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
  }, [voteStats, average]);

  const finalValue = useMemo(() => {
    if (voteStats.length === 0) return "—";
    if (tieInfo.isTie) {
      return tiePreference === "higher" ? tieInfo.highest : tieInfo.lowest;
    }
    return voteStats[0].card;
  }, [voteStats, tieInfo, tiePreference]);

  return (
    <div className="lg:col-span-2 flex flex-col items-center">
      <div className="mb-4 flex flex-col items-center gap-2 min-h-[100px] justify-center w-full">
        {isRevealed && (
          <div className="text-center transition-opacity duration-300 flex flex-col items-center gap-2 w-full">
            {isHost && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => saveAndNextStory(finalValue)}
                    className="px-5 py-1.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider"
                  >
                    Save & Next
                  </button>
                  <button
                    onClick={triggerRevote}
                    className="px-5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-700 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Re-vote
                  </button>
                </div>

                {tieInfo.isTie && (
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-xl text-xs mt-1 select-none animate-fadeIn">
                    <span className="text-neutral-500 px-2 font-medium">
                      Tie-break:
                    </span>
                    <button
                      type="button"
                      onClick={() => setTiePreference("lower")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        tiePreference === "lower"
                          ? "bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                      }`}
                    >
                      🔽 Lower ({tieInfo.lowest})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTiePreference("higher")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        tiePreference === "higher"
                          ? "bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                      }`}
                    >
                      🔼 Higher ({tieInfo.highest})
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-1 min-h-[64px] flex flex-col justify-center items-center">
              {isHost ? (
                <>
                  <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">
                    Suggested Estimate
                  </p>
                  <p className="text-4xl font-bold text-emerald-400 font-sans tracking-tight my-0.5">
                    {finalValue}
                  </p>
                </>
              ) : tieInfo.isTie ? (
                <div className="my-1 animate-fadeIn text-center">
                  <p className="text-amber-500 text-sm md:text-base font-extrabold mb-1">
                    ⚠️ Split vote ({tieInfo.lowest} vs {tieInfo.highest})
                  </p>
                  <p className="text-neutral-500 text-[10px] font-medium animate-pulse">
                    ⏳ Awaiting host decision...
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">
                    Suggested Estimate
                  </p>
                  <p className="text-4xl font-bold text-emerald-400 font-sans tracking-tight my-0.5">
                    {finalValue}
                  </p>
                </>
              )}
            </div>

            {voteStats.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-1">
                <div
                  className="bg-emerald-500/10 px-2.5 py-1 rounded-md text-xs border border-emerald-500/20 flex items-center gap-1 font-mono text-emerald-400 font-bold shadow-sm"
                  title="Exact mathematical average"
                >
                  <span className="text-emerald-500/60 font-sans text-[10px] uppercase tracking-wider mr-0.5">
                    avg
                  </span>
                  {average}
                </div>

                {voteStats.map((stat) => (
                  <div
                    key={stat.card}
                    className="bg-neutral-900 px-2.5 py-1 rounded-md text-xs border border-neutral-800 flex items-center gap-1.5"
                  >
                    <span className="font-bold text-white">{stat.card}</span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-emerald-400">{stat.percentage}%</span>
                    <span className="text-neutral-500">({stat.count})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isRevealed && displayedPlayers.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 text-center">
            {!activeStory ? (
              <>
                {isHost && displayedPlayers.length === 1 && (
                  <p className="text-neutral-600 text-xs">
                    Tip: Click the room tag above to copy the invite link
                  </p>
                )}
              </>
            ) : (
              !displayedPlayers.every((p) => p.selectedCard !== null) && (
                <p className="text-neutral-500 text-sm animate-pulse">
                  Waiting for all players to vote...
                </p>
              )
            )}
          </div>
        )}
      </div>

      <div
        className={`flex flex-wrap content-start justify-center mb-4 min-h-[100px] w-full transition-all duration-300 ${
          isCrowded ? "gap-x-2 gap-y-2.5" : "gap-6"
        }`}
      >
        {displayedPlayers.map((player) => {
          const isVoter =
            isRevealed && votesSnapshot
              ? votesSnapshot.some((v) => v.id === player.id)
              : true;
          const isActive = players.some((p) => p.id === player.id);

          const isOffline = isRevealed && !isActive;

          const isLateJoin = isRevealed && !isVoter && isActive;

          const isFaded = isOffline || isLateJoin;

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center transition-all duration-300 text-center group relative ${
                isCrowded ? "w-[64px] gap-1" : "w-[90px] gap-2"
              } ${isFaded ? "opacity-40 scale-95" : "opacity-100 scale-100"}`}
            >
              <div
                className={`transition-all duration-300 relative [perspective:1000px] ${
                  isCrowded ? "w-10 h-14" : "w-14 h-20"
                }`}
              >
                <div
                  className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${
                    isRevealed ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 w-full h-full rounded-xl border flex items-center justify-center [backface-visibility:hidden] transition-all duration-300 ${
                      player.selectedCard
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 text-xs"
                        : "bg-neutral-900 border-neutral-800 text-neutral-600"
                    }`}
                  >
                    {player.selectedCard ? (
                      "✔️"
                    ) : (
                      <span className={isCrowded ? "text-xl" : "text-2xl"}>
                        {playerEmojis[player.id]}
                      </span>
                    )}
                  </div>

                  <div
                    className={`absolute inset-0 w-full h-full rounded-xl border flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 ${
                      player.selectedCard
                        ? "bg-emerald-500 border border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-neutral-900 border-neutral-800 text-neutral-600"
                    }`}
                  >
                    {player.selectedCard ? (
                      <span
                        className={`font-bold transition-all ${
                          isCrowded ? "text-sm" : "text-lg"
                        }`}
                      >
                        {player.selectedCard}
                      </span>
                    ) : (
                      <span className={isCrowded ? "text-xl" : "text-2xl"}>
                        {playerEmojis[player.id]}
                      </span>
                    )}
                  </div>
                </div>

                {isHost &&
                  player.id !== myUserId &&
                  !player.id.startsWith("mock-") && (
                    <div
                      className="absolute top-0 right-0 z-30 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === player.id ? null : player.id,
                          )
                        }
                        className={`flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer focus:outline-none active:scale-95 ${
                          isCrowded ? "w-6 h-6" : "w-7 h-7"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.8}
                          stroke="currentColor"
                          className={isCrowded ? "w-3.5 h-3.5" : "w-4 h-4"}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                          />
                        </svg>
                      </button>

                      {activeMenuId === player.id && (
                        <div className="absolute right-full top-0.5 mr-1 flex flex-col bg-neutral-950/95 backdrop-blur-sm border border-neutral-800 rounded-lg shadow-2xl py-1 z-40 animate-fadeIn min-w-[105px]">
                          <button
                            type="button"
                            onClick={() => {
                              promotePlayer(player.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-[11px] text-amber-400 hover:bg-neutral-900 transition-colors flex items-center justify-start gap-2 font-bold cursor-pointer rounded-t whitespace-nowrap"
                          >
                            <span className="inline-block -translate-y-[0.5px]">
                              👑
                            </span>{" "}
                            Promote
                          </button>
                          <div className="h-[1px] w-full bg-neutral-800/80 flex-shrink-0" />
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to kick ${player.name}?`,
                                )
                              ) {
                                kickPlayer(player.id);
                              }
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-[11px] text-red-500 hover:bg-neutral-900 transition-colors flex items-center justify-start gap-2 font-bold cursor-pointer rounded-b whitespace-nowrap"
                          >
                            <span className="inline-block -translate-y-[0.5px]">
                              🚫
                            </span>{" "}
                            Kick
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                {player.id === hostId && (
                  <span
                    className={`absolute transform rotate-12 drop-shadow-md z-20 transition-all ${
                      isCrowded
                        ? "-top-2.5 -right-1.5 text-sm"
                        : "-top-3.5 -right-3 text-lg"
                    }`}
                  >
                    👑
                  </span>
                )}
                {player.id === myUserId && (
                  <span className="absolute -top-2 -left-2 bg-neutral-800 border border-neutral-700 text-[8px] px-1 py-0.5 rounded-full text-neutral-400 font-bold uppercase tracking-wide z-20">
                    You
                  </span>
                )}
              </div>

              <span className="text-xs font-medium text-neutral-400 w-full truncate text-center flex flex-col items-center gap-0.5">
                <span className="w-full truncate px-1">{player.name}</span>
                {isOffline && (
                  <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wider bg-neutral-900 px-1 rounded border border-neutral-800">
                    Offline
                  </span>
                )}
                {isLateJoin && (
                  <span className="text-[9px] text-sky-400 font-semibold uppercase tracking-wider bg-neutral-900 px-1 rounded border border-sky-900/50">
                    Joined
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
