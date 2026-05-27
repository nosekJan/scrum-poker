import React, { useState, useEffect, useMemo } from "react";
import { Card } from "./Card";
import type { CardValue } from "../types/poker";
import { usePokerGame } from "../hooks/usePokerGame";

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

  const { players, castVote, isRevealed, toggleReveal } = usePokerGame(
    roomId,
    playerName,
  );

  useEffect(() => {
    if (!isRevealed) {
      setSelectedCard(null);
    }
  }, [isRevealed]);

  const handleCardClick = (value: CardValue) => {
    if (isRevealed) return;
    const newValue = selectedCard === value ? null : value;
    setSelectedCard(newValue);
    castVote(newValue);
  };

  // 🔥 Logika pre výpočet priemeru (ignoruje kávu a otáznik)
  const average = useMemo(() => {
    const validVotes = players
      .map((p) => p.selectedCard)
      .filter((val) => val !== null && val !== "?" && val !== "☕")
      .map((val) => parseFloat(val as string));

    if (validVotes.length === 0) return 0;
    const sum = validVotes.reduce((acc, curr) => acc + curr, 0);
    return (sum / validVotes.length).toFixed(1);
  }, [players]);

  return (
    <div className="min-h-screen flex flex-col p-6 bg-neutral-950 text-white">
      <header className="flex justify-between items-center mb-12 max-w-5xl mx-auto w-full">
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
          <button
            onClick={onLeave}
            className="px-3 py-1.5 border border-neutral-700 rounded-lg text-xs hover:bg-neutral-800 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-4">
          {!isRevealed ? (
            <button
              onClick={() => toggleReveal(true)}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors"
            >
              Reveal Cards
            </button>
          ) : (
            <button
              onClick={() => toggleReveal(false)}
              className="px-6 py-2 bg-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-600 transition-colors"
            >
              Start New Vote
            </button>
          )}

          {/* 🔥 Vykreslenie priemeru pod tlačidlom */}
          {isRevealed && (
            <div className="text-center transition-opacity duration-300">
              <p className="text-neutral-400 text-sm mb-1">Average</p>
              <p className="text-3xl font-bold text-emerald-400">{average}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap content-start justify-center gap-8 mb-12 min-h-[200px] w-full">
          {players.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-24 rounded-xl border-2 flex items-center justify-center transition-all ${
                  player.selectedCard
                    ? isRevealed
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-neutral-800 border-neutral-700 text-neutral-500"
                }`}
              >
                {isRevealed && player.selectedCard ? (
                  <span className="font-bold text-xl">
                    {player.selectedCard}
                  </span>
                ) : player.selectedCard ? (
                  "✔️"
                ) : (
                  "🤔"
                )}
              </div>
              <span className="text-sm font-medium text-neutral-300">
                {player.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-auto max-w-3xl mx-auto pb-8 transition-opacity"
        style={{
          opacity: isRevealed ? 0.5 : 1,
          pointerEvents: isRevealed ? "none" : "auto",
        }}
      >
        <p className="text-center text-sm text-neutral-400 mb-4">
          Choose your estimate
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {cards.map((value) => (
            <Card
              key={value}
              value={value}
              isSelected={selectedCard === value}
              onClick={() => handleCardClick(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
