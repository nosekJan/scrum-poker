import React, { useState, useEffect } from "react";
import { Card } from "../Card";
import { usePoker } from "../../context/PokerContext";
import { myUserId } from "../../hooks/usePokerGame";
import type { CardValue } from "../../types/poker";

const CARDS: CardValue[] = [
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

export const VotingDeck: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const { isRevealed, activeStory, castVote, votesSnapshot, hostId } =
    usePoker();

  const isHost = myUserId === hostId;

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

  const amIInThisRound = votesSnapshot
    ? votesSnapshot.some((p) => p.id === myUserId)
    : true;

  if (isRevealed && !amIInThisRound) {
    return (
      <div className="mt-auto max-w-3xl mx-auto pb-4">
        <p className="text-center text-sm text-neutral-500 font-medium bg-neutral-900/50 py-3 px-6 rounded-lg border border-neutral-800">
          The round is currently being evaluated. Please wait for the next story
          to begin...
        </p>
      </div>
    );
  }

  const isDisabled = !activeStory || isRevealed;

  return (
    <div
      className={`mt-auto max-w-3xl mx-auto pb-4 transition-all duration-300 ${
        isDisabled
          ? "opacity-30 pointer-events-none"
          : "opacity-100 pointer-events-auto"
      }`}
    >
      <p className="text-center text-xs text-neutral-500 mb-4 font-medium tracking-wide">
        {!activeStory
          ? isHost
            ? "Set an active story to start voting"
            : "Voting will unlock once a story is set"
          : "Choose your estimate"}
      </p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {CARDS.map((value) => (
          <Card
            key={value}
            value={value}
            isSelected={selectedCard === value}
            onClick={() => handleCardClick(value)}
          />
        ))}
      </div>
    </div>
  );
};
