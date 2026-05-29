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
  } = usePoker();

  const isHost = myUserId === hostId;

  const displayedPlayers = useMemo(() => {
    if (isRevealed && votesSnapshot) {
      return votesSnapshot;
    }
    return players;
  }, [isRevealed, votesSnapshot, players]);

  const average = useMemo(() => {
    const validVotes = displayedPlayers
      .map((p) => p.selectedCard)
      .filter((val) => val !== null && val !== "?" && val !== "☕")
      .map((val) => parseFloat(val as string));
    if (validVotes.length === 0) return "0.0";
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

        {!isRevealed &&
          displayedPlayers.length > 0 &&
          !displayedPlayers.every((p) => p.selectedCard !== null) && (
            <p className="text-neutral-500 text-sm animate-pulse">
              Waiting for all players to vote...
            </p>
          )}
      </div>

      <div className="flex flex-wrap content-start justify-center gap-6 mb-12 min-h-[180px] w-full">
        {displayedPlayers.map((player) => {
          const isOffline =
            isRevealed && !players.some((p) => p.id === player.id);

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center gap-2.5 transition-opacity duration-300 ${
                isOffline ? "opacity-40" : "opacity-100"
              }`}
            >
              <div
                className={`group w-14 h-20 rounded-xl border flex items-center justify-center transition-all duration-300 relative ${
                  player.selectedCard
                    ? isRevealed
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-neutral-900 border-neutral-800 text-neutral-600"
                }`}
              >
                {isRevealed && player.selectedCard ? (
                  <span className="font-bold text-lg">
                    {player.selectedCard}
                  </span>
                ) : player.selectedCard ? (
                  "✔️"
                ) : (
                  "🤔"
                )}
                {player.id === hostId && (
                  <span className="absolute -top-3.5 -right-3 text-lg transform rotate-12 drop-shadow-md">
                    👑
                  </span>
                )}
                {player.id === myUserId && (
                  <span className="absolute -top-2 -left-2 bg-neutral-800 border border-neutral-700 text-[9px] px-1.5 py-0.5 rounded-full text-neutral-400 font-bold uppercase tracking-wide z-20">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-neutral-400 max-w-[80px] truncate text-center flex flex-col items-center gap-0.5">
                <span>{player.name}</span>
                {isOffline && (
                  <span className="text-[9px] text-neutral-600 font-semibold uppercase tracking-wider">
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
