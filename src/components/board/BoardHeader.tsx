import React from "react";
import { usePoker } from "../../context/PokerContext";
import { myUserId } from "../../hooks/usePokerGame";

interface BoardHeaderProps {
  roomId: string;
  playerName: string;
  onLeave: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  roomId,
  playerName,
  onLeave,
}) => {
  const { hostId, endSession } = usePoker();
  const isHost = myUserId === hostId;

  return (
    <header className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold">
          Kestra Poker <span className="text-emerald-500">.</span>
        </h1>
        <div className="hidden sm:flex items-center px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-400">
          Room: <span className="text-white ml-2 font-mono">{roomId}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-neutral-400">
          Playing as <strong className="text-white">{playerName}</strong>
        </span>
        {isHost && (
          <button
            onClick={endSession}
            className="px-3 py-1.5 border border-red-900/50 bg-red-900/20 rounded-lg text-xs text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
          >
            End Session
          </button>
        )}
        <button
          onClick={onLeave}
          className="px-3 py-1.5 border border-neutral-700 rounded-lg text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Leave
        </button>
      </div>
    </header>
  );
};
