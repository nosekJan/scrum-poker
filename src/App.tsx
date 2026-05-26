import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { Lobby } from "./components/Lobby";
import { Board } from "./components/Board";

// Jednoduchá utilita na vygenerovanie náhodného 6-miestneho ID miestnosti
const generateRoomId = () => Math.random().toString(36).substring(2, 8);

// Komponent pre hlavnú stránku - iba ťa prehodí do novej miestnosti
function Home() {
  return <Navigate to={`/room/${generateRoomId()}`} replace />;
}

// Komponent pre samotnú miestnosť
function Room() {
  const { roomId } = useParams<{ roomId: string }>(); // Vytiahneme ID miestnosti z URL
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

  // Zostáva iba JEDEN čistý return, ktorý posiela všetky potrebné dáta do stola
  return (
    <Board roomId={roomId!} playerName={playerName} onLeave={handleLeave} />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
