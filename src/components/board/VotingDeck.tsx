import React, { useState, useEffect } from "react";
import { Card } from "../Card";
import { usePoker } from "../../context/PokerContext";
import type { CardValue } from "../../types/poker";

export const VotingDeck: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const { isRevealed, activeStory, castVote } = usePoker();

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

  return (
    <div
      className="mt-auto max-w-3xl mx-auto pb-4 transition-all duration-300"
      style={{
        opacity: !activeStory || isRevealed ? 0.3 : 1,
        pointerEvents: !activeStory || isRevealed ? "none" : "auto",
      }}
    >
      <p className="text-center text-xs text-neutral-400 mb-3">
        {!activeStory
          ? "Set an active story to start voting"
          : "Choose your estimate"}
      </p>
      <div className="flex flex-wrap gap-2.5 justify-center">
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
  );
};
