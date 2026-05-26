import { useState } from "react";
import { Card } from "./components/Card";
import type { CardValue } from "./types/poker";

function App() {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-950 text-white">
      <h1 className="text-3xl font-bold mb-8 text-neutral-200">
        Testovacia hracia sada
      </h1>

      <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
        {cards.map((value) => (
          <Card
            key={value}
            value={value}
            isSelected={selectedCard === value}
            onClick={() => setSelectedCard(value)}
          />
        ))}
      </div>

      {selectedCard && (
        <p className="mt-8 text-lg text-emerald-400">
          Vybral si kartu: <span className="font-bold">{selectedCard}</span>
        </p>
      )}
    </div>
  );
}

export default App;
