import { useState, useEffect } from "react";
import { Lobby } from "./components/Lobby";
import { Board } from "./components/Board";

function App() {
  const [playerName, setPlayerName] = useState<string | null>(null);

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

  const handleLeave = () => {
    localStorage.removeItem("kestra_poker_name");
    setPlayerName(null);
  };

  if (!playerName) {
    return <Lobby onJoin={handleJoin} />;
  }

  // Tu sme nahradili placeholder za realny hrací stôl
  return <Board playerName={playerName} onLeave={handleLeave} />;
}

export default App;
