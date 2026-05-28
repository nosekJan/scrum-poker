import React from "react";
import { PokerProvider } from "../context/PokerContext";
import { BoardHeader } from "./board/BoardHeader";
import { PlayerDesk } from "./board/PlayerDesk";
import { StorySidebar } from "./board/StorySidebar";
import { VotingDeck } from "./board/VotingDeck";

interface BoardProps {
  roomId: string;
  playerName: string;
  onLeave: () => void;
}

export const Board: React.FC<BoardProps> = ({
  roomId,
  playerName,
  onLeave,
}) => {
  return (
    <PokerProvider roomId={roomId} playerName={playerName} onLeave={onLeave}>
      <div className="min-h-screen flex flex-col p-6 bg-neutral-950 text-white">
        <BoardHeader
          roomId={roomId}
          playerName={playerName}
          onLeave={onLeave}
        />

        <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PlayerDesk />
          <StorySidebar />
        </div>

        <VotingDeck />
      </div>
    </PokerProvider>
  );
};
