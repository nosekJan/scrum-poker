import React from "react";
import { PokerProvider } from "../context/PokerContext";
import { usePoker } from "../hooks/usePoker";
import { BoardHeader } from "./board/BoardHeader";
import { PlayerDesk } from "./board/PlayerDesk";
import { StorySidebar } from "./board/StorySidebar";
import { VotingDeck } from "./board/VotingDeck";
import { BugReportWidget } from "./BugReportWidget";
import { RoomNotifications } from "./RoomNotifications";
import { KickedModal } from "./KickedModal";

interface BoardProps {
  roomId: string;
  playerName: string;
  onLeave: () => void;
}

const BoardContent: React.FC<BoardProps> = ({
  roomId,
  playerName,
  onLeave,
}) => {
  const { notifications, isKicked, leaveRoom } = usePoker();

  return (
    <div className="relative min-h-screen lg:h-screen flex flex-col p-4 lg:py-3 lg:px-6 bg-neutral-950 text-white">
      <KickedModal isOpen={isKicked} onConfirm={leaveRoom} />

      <RoomNotifications notifications={notifications} />

      <BoardHeader roomId={roomId} playerName={playerName} onLeave={onLeave} />
      <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_auto] gap-y-6 lg:gap-y-0 lg:gap-x-8 lg:h-[calc(100vh-140px)] lg:min-h-0">
        <div className="lg:col-span-2 lg:row-start-1 flex flex-col lg:min-h-0">
          <PlayerDesk />
        </div>

        <div className="order-2 lg:order-none lg:col-span-3 lg:row-start-2 flex flex-col justify-end mt-2 lg:mt-0">
          <VotingDeck />
        </div>

        <div className="order-3 lg:order-none lg:col-span-1 lg:row-start-1 flex flex-col lg:min-h-0">
          <StorySidebar />
        </div>
      </div>

      <BugReportWidget />
    </div>
  );
};

export const Board: React.FC<BoardProps> = ({
  roomId,
  playerName,
  onLeave,
}) => {
  return (
    <PokerProvider roomId={roomId} playerName={playerName} onLeave={onLeave}>
      <BoardContent roomId={roomId} playerName={playerName} onLeave={onLeave} />
    </PokerProvider>
  );
};
