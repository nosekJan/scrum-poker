import React, { useMemo, useState, useEffect } from "react";
import { usePoker } from "../../context/PokerContext";
import { myUserId } from "../../hooks/usePokerGame";

export const PlayerDesk: React.FC = () => {
  const {
    players,
    votesSnapshot,
    isRevealed,
    saveAndNextStory,
    triggerRevote,
    hostId,
    activeStory,
  } = usePoker();

  const isHost = myUserId === hostId;

  const displayedPlayers = useMemo(() => {
    return isRevealed && votesSnapshot ? votesSnapshot : players;
  }, [isRevealed, votesSnapshot, players]);

  const isCrowded = displayedPlayers.length > 10;

  // 1. Presný matematický priemer (pre malý zelený štítok)
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

  // 2. Štatistiky hlasovania zoradené od najpoužívanejšej karty
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

  // Lokálny stav pre voľbu hosta pri remíze (Tie-break)
  const [tiePreference, setTiePreference] = useState<"higher" | "lower">(
    "higher",
  );

  // Automatický reset prepínača pri novom hlasovaní
  useEffect(() => {
    if (!isRevealed) {
      setTiePreference("higher");
    }
  }, [isRevealed]);

  // 3. Inteligentná detekcia remízy ukotvená o matematický priemer (Smart Anchor)
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

    // Prevedieme karty na čísla pre presný matematický filter
    const numericCards = topCards
      .map((c) => ({ string: c, number: parseFloat(c) }))
      .filter((c) => !isNaN(c.number));

    // Rozdelíme karty na tie pod priemerom a nad priemerom
    const belowOrEqual = numericCards.filter((c) => c.number <= numAverage);
    const aboveOrEqual = numericCards.filter((c) => c.number >= numAverage);

    let smartLower = "";
    let smartHigher = "";

    if (belowOrEqual.length > 0) {
      // Nájdeme kartu najbližšiu k priemeru zhasnutím smerom nadol
      belowOrEqual.sort((a, b) => b.number - a.number);
      smartLower = belowOrEqual[0].string;
    } else {
      const sorted = [...numericCards].sort((a, b) => a.number - b.number);
      smartLower = sorted[0].string;
    }

    if (aboveOrEqual.length > 0) {
      // Nájdeme kartu najbližšiu k priemeru zhasnutím smerom nahor
      aboveOrEqual.sort((a, b) => a.number - b.number);
      smartHigher = aboveOrEqual[0].string;
    } else {
      const sorted = [...numericCards].sort((a, b) => b.number - a.number);
      smartHigher = sorted[0].string;
    }

    // Ak sa spodná aj horná najbližšia karta rovnajú (napr. priemer sadol presne na stredovú kartu pri 3 ľuďoch)
    if (smartLower === smartHigher) {
      return { isTie: false, lowest: smartLower, highest: smartHigher };
    }

    return {
      isTie: true,
      lowest: smartLower,
      highest: smartHigher,
    };
  }, [voteStats, average]);

  // 4. Výsledná celá karta priradená k úlohe
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
            {/* SEKCOU 1: Ovládacie prvky - IBA PRE HOSTA */}
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

            {/* SEKCIA 2: Hlavný stavový text a Hodnota */}
            <div className="mt-1 min-h-[64px] flex flex-col justify-center items-center">
              {isHost ? (
                // Host vidí vždy čisté Suggested Estimate a veľké číslo, ktoré ukladá
                <>
                  <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">
                    Suggested Estimate
                  </p>
                  <p className="text-4xl font-bold text-emerald-400 font-sans tracking-tight my-0.5">
                    {finalValue}
                  </p>
                </>
              ) : // Hráč vidí buď veľké číslo, alebo jasné varovanie o remíze BEZ mätúceho čísla
              tieInfo.isTie ? (
                <div className="my-1 animate-fadeIn text-center">
                  <p className="text-amber-500 text-sm md:text-base uppercase tracking-wider font-extrabold mb-1">
                    ⚠️ Split Vote ({tieInfo.lowest} vs {tieInfo.highest})
                  </p>
                  <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest animate-pulse">
                    ⏳ Awaiting Host Decision
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

            {/* SEKCIA 3: Štatistické pilulky (Pills) */}
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

      {/* Desk s hráčmi */}
      <div
        className={`flex flex-wrap content-start justify-center mb-4 min-h-[130px] w-full transition-all duration-300 ${
          isCrowded ? "gap-x-3 gap-y-5" : "gap-6"
        }`}
      >
        {displayedPlayers.map((player) => {
          const isOffline =
            isRevealed && !players.some((p) => p.id === player.id);

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center gap-2 transition-all duration-300 text-center ${
                isCrowded ? "w-[76px]" : "w-[90px]"
              } ${isOffline ? "opacity-40 scale-95" : "opacity-100 scale-100"}`}
            >
              <div
                className={`transition-all duration-300 relative [perspective:1000px] ${
                  isCrowded ? "w-12 h-16" : "w-14 h-20"
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
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                        : "bg-neutral-900 border-neutral-800 text-neutral-600"
                    } ${isCrowded ? "text-sm" : "text-base"}`}
                  >
                    {player.selectedCard ? "✔️" : "🤔"}
                  </div>

                  <div
                    className={`absolute inset-0 w-full h-full rounded-xl border flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 ${
                      player.selectedCard
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-neutral-900 border-neutral-800 text-neutral-600"
                    }`}
                  >
                    {player.selectedCard ? (
                      <span
                        className={`font-bold transition-all ${
                          isCrowded ? "text-base" : "text-lg"
                        }`}
                      >
                        {player.selectedCard}
                      </span>
                    ) : (
                      "🤔"
                    )}
                  </div>
                </div>

                {player.id === hostId && (
                  <span
                    className={`absolute transform rotate-12 drop-shadow-md z-20 transition-all ${
                      isCrowded
                        ? "-top-3 -right-2 text-base"
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
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
