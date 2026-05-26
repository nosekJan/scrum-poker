import React, { useState } from "react";
import { Card } from "./Card";
import type { CardValue } from "../types/poker";

interface BoardProps {
  roomId: string; // <-- Pridali sme roomId do typov
  playerName: string;
  onLeave: () => void;
}

export const Board: React.FC<BoardProps> = ({
  roomId,
  playerName,
  onLeave,
}) => {
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const cards: CardValue[] = [
    "0",
    "0.5",
    "1",
    "2",
    "3",
    "5",
    "8",
    "13",
    "20",
    "40",
    "100",
    "?",
    "☕",
  ];

  return (
    <div className="min-h-screen flex flex-col p-6 bg-neutral-950 text-white">
      {/* Hlavicka stola */}
      <header className="flex justify-between items-center mb-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">
            Kestra Poker <span className="text-emerald-500">.</span>
          </h1>
          {/* Tu zobrazujeme ID miestnosti v peknom badge */}
          <div className="hidden sm:flex items-center px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-400">
            Room: <span className="text-white ml-2 font-mono">{roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-neutral-400">
            Playing as <strong className="text-white">{playerName}</strong>
          </span>
          <button
            onClick={onLeave}
            className="px-3 py-1.5 border border-neutral-700 rounded-lg text-xs hover:bg-neutral-800 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Tu neskor pribudne zoznam ostatnych hracov pri stole (Avatary) */}
      <div className="flex-1 max-w-5xl mx-auto w-full flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-3xl mb-12 min-h-[200px]">
        <p className="text-neutral-500">Ostatní hráči sa zobrazia tu...</p>
      </div>

      {/* Moje karty na hlasovanie */}
      <div className="mt-auto max-w-3xl mx-auto pb-8">
        <p className="text-center text-sm text-neutral-400 mb-4">
          Choose your estimate
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {cards.map((value) => (
            <Card
              key={value}
              value={value}
              isSelected={selectedCard === value}
              onClick={() => setSelectedCard(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
