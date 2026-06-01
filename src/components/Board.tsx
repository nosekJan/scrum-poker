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

        <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_auto] gap-y-8 lg:gap-y-0 lg:gap-x-8">
          <div className="lg:col-span-2 lg:row-start-1 flex flex-col">
            <PlayerDesk />
          </div>

          <div className="order-2 lg:order-none lg:col-span-3 lg:row-start-2 flex flex-col justify-end mt-4 lg:mt-0">
            <VotingDeck />
          </div>

          <div className="order-3 lg:order-none lg:col-span-1 lg:row-start-1 flex flex-col">
            <StorySidebar />
          </div>
        </div>
      </div>
    </PokerProvider>
  );
};
