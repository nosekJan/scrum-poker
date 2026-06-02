import React, { useMemo } from "react";
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

  return (
    <div className="lg:col-span-2 flex flex-col items-center">
      <div className="mb-8 flex flex-col items-center gap-4 min-h-[140px] justify-center w-full">
        {isRevealed && (
          <>
            <div className="flex gap-4">
              {isHost && (
                <>
                  <button
                    onClick={() => saveAndNextStory(average)}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Save & Next Story
                  </button>
                  <button
                    onClick={triggerRevote}
                    className="px-6 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Re-vote
                  </button>
                </>
              )}
            </div>

            <div className="text-center transition-opacity duration-300 flex flex-col items-center gap-1">
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-0.5">
                  Average
                </p>
                <p className="text-4xl font-bold text-emerald-400">{average}</p>
              </div>

              {voteStats.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {voteStats.map((stat) => (
                    <div
                      key={stat.card}
                      className="bg-neutral-900 px-2.5 py-1 rounded-md text-xs border border-neutral-800 flex items-center gap-1.5"
                    >
                      <span className="font-bold text-white">{stat.card}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-emerald-400">
                        {stat.percentage}%
                      </span>
                      <span className="text-neutral-500">({stat.count})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
        className={`flex flex-wrap content-start justify-center mb-12 min-h-[180px] w-full transition-all duration-300 ${
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
