import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Lobby } from "./components/Lobby";
import { Board } from "./components/Board";

// 🔥 Wrapper komponent pre hlavnú cestu "/" (prázdna Lobby)
function HomeRoute() {
  const navigate = useNavigate();

  const handleJoin = (name: string, roomId: string) => {
    localStorage.setItem("kestra_poker_name", name);
    navigate(`/room/${roomId}`);
  };

  return <Lobby onJoin={handleJoin} />;
}

// 🔥 Wrapper komponent pre cestu "/room/:roomId"
function RoomRoute() {
  const { roomId } = useParams<{ roomId: string }>();
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("kestra_poker_name");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Ak hráč prišiel priamo cez link, ale nemá uložené meno,
  // zobrazíme mu Lobby a predvyplníme mu roomId.
  if (!playerName) {
    return (
      <Lobby
        initialRoomId={roomId}
        onJoin={(name, joinedRoomId) => {
          localStorage.setItem("kestra_poker_name", name);
          setPlayerName(name);
          // Ak by si v predvyplnenej URL náhodou prepísal názov izby,
          // musíme aktualizovať URL
          if (joinedRoomId !== roomId) {
            window.location.href = `/room/${joinedRoomId}`;
          }
        }}
      />
    );
  }

  const handleLeave = () => {
    localStorage.removeItem("kestra_poker_name");
    setPlayerName(null);
  };

  return (
    <Board roomId={roomId!} playerName={playerName} onLeave={handleLeave} />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/room/:roomId" element={<RoomRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
