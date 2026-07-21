import React, { useMemo, useState, useEffect } from "react";
import { usePoker } from "../../hooks/usePoker";
import { myUserId } from "../../utils/poker";
import type { Player } from "../../types/poker";
import {
  getPlayerEmojiMapping,
  calculateAverage,
  calculateVoteStats,
  calculateTieInfo,
} from "../../utils/poker";
import { PlayerDeskCard } from "./PlayerDeskCard";
import { PlayerDeskStats } from "./PlayerDeskStats";

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
  const [tiePreference, setTiePreference] = useState<"higher" | "lower">(
    "higher",
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (isRevealed) {
      setSeenDuringReveal((prev) => {
        const newPlayers = players.filter(
          (p) => !prev.some((existing) => existing.id === p.id),
        );
        return newPlayers.length > 0 ? [...prev, ...newPlayers] : prev;
      });
    } else {
      setSeenDuringReveal([]);
      setTiePreference("higher");
    }
  }, [isRevealed, players]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

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
  const playerEmojis = useMemo(
    () => getPlayerEmojiMapping(displayedPlayers),
    [displayedPlayers],
  );
  const average = useMemo(
    () => calculateAverage(displayedPlayers),
    [displayedPlayers],
  );
  const voteStats = useMemo(
    () => calculateVoteStats(displayedPlayers, isRevealed),
    [displayedPlayers, isRevealed],
  );
  const tieInfo = useMemo(
    () => calculateTieInfo(voteStats, average),
    [voteStats, average],
  );

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
          <PlayerDeskStats
            isHost={isHost}
            finalValue={finalValue}
            average={average}
            voteStats={voteStats}
            tieInfo={tieInfo}
            tiePreference={tiePreference}
            setTiePreference={setTiePreference}
            onSaveAndNext={saveAndNextStory}
            onTriggerRevote={triggerRevote}
          />
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

          return (
            <PlayerDeskCard
              key={player.id}
              player={player}
              isHost={isHost}
              hostId={hostId}
              myUserId={myUserId}
              isRevealed={isRevealed}
              isCrowded={isCrowded}
              isOffline={isOffline}
              isLateJoin={isLateJoin}
              emoji={playerEmojis[player.id]}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              onPromote={promotePlayer}
              onKick={kickPlayer}
            />
          );
        })}
      </div>
    </div>
  );
};
