import React, { useState } from "react";
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
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = async () => {
    try {
      const inviteUrl = `${window.location.origin}/?room=${roomId}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="flex justify-between items-center mb-4 lg:mb-3 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold whitespace-nowrap">
          Kestra Poker <span className="text-emerald-500">.</span>
        </h1>
        <button
          onClick={handleCopyInvite}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 rounded-xl text-sm text-neutral-400 hover:text-emerald-400 transition-all cursor-pointer group shrink-0"
          title="Copy full invite link"
        >
          <span className="font-medium">Room:</span>
          <span className="text-white font-mono group-hover:text-emerald-400 transition-colors">
            {roomId.substring(0, 8)}...
          </span>
          {copied ? (
            <span className="text-xs text-emerald-400 font-bold ml-1">
              Link Copied!
            </span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          )}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-neutral-400 whitespace-nowrap">
          Playing as <strong className="text-white">{playerName}</strong>
        </span>
        {isHost && (
          <button
            onClick={endSession}
            className="px-3 py-1.5 border border-red-900/50 bg-red-900/20 rounded-lg text-xs text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer whitespace-nowrap"
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
