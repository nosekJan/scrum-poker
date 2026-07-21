import React from "react";
import { MoreVertical, Crown, Ban, Check } from "lucide-react";
import type { Player } from "../../types/poker";

interface PlayerDeskCardProps {
  player: Player;
  isHost: boolean;
  hostId: string | null;
  myUserId: string;
  isRevealed: boolean;
  isCrowded: boolean;
  isOffline: boolean;
  isLateJoin: boolean;
  emoji: string;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onPromote: (id: string) => void;
  onKick: (id: string) => void;
}

export const PlayerDeskCard: React.FC<PlayerDeskCardProps> = ({
  player,
  isHost,
  hostId,
  myUserId,
  isRevealed,
  isCrowded,
  isOffline,
  isLateJoin,
  emoji,
  activeMenuId,
  setActiveMenuId,
  onPromote,
  onKick,
}) => {
  const isFaded = isOffline || isLateJoin;
  const isMenuOpen = activeMenuId === player.id;

  return (
    <div
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
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <span className={isCrowded ? "text-xl" : "text-2xl"}>
                {emoji}
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
                {emoji}
              </span>
            )}
          </div>
        </div>

        {isHost && player.id !== myUserId && !player.id.startsWith("mock-") && (
          <div
            className="absolute top-0 right-0 z-30 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveMenuId(isMenuOpen ? null : player.id)}
              className={`flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer focus:outline-none active:scale-95 ${
                isCrowded ? "w-6 h-6" : "w-7 h-7"
              }`}
              title="Player Options"
            >
              <MoreVertical className={isCrowded ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-full top-0.5 mr-1 flex flex-col bg-neutral-950/95 backdrop-blur-sm border border-neutral-800 rounded-lg shadow-2xl py-1 z-40 animate-fadeIn min-w-[105px]">
                <button
                  type="button"
                  onClick={() => {
                    onPromote(player.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-[11px] text-amber-400 hover:bg-neutral-900 transition-colors flex items-center justify-start gap-2 font-bold cursor-pointer rounded-t whitespace-nowrap"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
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
                      onKick(player.id);
                    }
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-[11px] text-red-500 hover:bg-neutral-900 transition-colors flex items-center justify-start gap-2 font-bold cursor-pointer rounded-b whitespace-nowrap"
                >
                  <Ban className="w-3.5 h-3.5 text-red-500" />
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
};
