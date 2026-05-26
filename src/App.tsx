import { useState, useEffect } from "react";
import { Lobby } from "./components/Lobby";

function App() {
  const [playerName, setPlayerName] = useState<string | null>(null);

  // Pri prvom načítaní skontrolujeme, či už náhodou nemáme meno uložené
  useEffect(() => {
    const savedName = localStorage.getItem("kestra_poker_name");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const handleJoin = (name: string) => {
    localStorage.setItem("kestra_poker_name", name);
    setPlayerName(name);
  };

  // Ak nemáme meno, ukážeme Lobby
  if (!playerName) {
    return <Lobby onJoin={handleJoin} />;
  }

  // Ak máme meno, zatiaľ ukážeme len takýto placeholder.
  // Neskôr sem dáme samotný hrací stôl.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to the table,{" "}
        <span className="text-emerald-500">{playerName}</span>!
      </h1>
      <button
        onClick={() => {
          localStorage.removeItem("kestra_poker_name");
          setPlayerName(null);
        }}
        className="px-4 py-2 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-800"
      >
        Leave Table (Reset Meno)
      </button>
    </div>
  );
}

export default App;
