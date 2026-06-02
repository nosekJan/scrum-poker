import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { Lobby } from "./components/Lobby";
import { Board } from "./components/Board";
import { supabase } from "./lib/supabase";

function HomeRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const errorMsg = location.state?.error;

  const handleJoin = (name: string, roomId: string, isCreating: boolean) => {
    localStorage.setItem("kestra_poker_name", name);
    localStorage.setItem("kestra_poker_room", roomId);
    navigate(`/room/${roomId}`, { state: { isCreating } });
  };

  return <Lobby onJoin={handleJoin} error={errorMsg} />;
}

function RoomRoute() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const checkRoomAccess = async () => {
      const savedName = localStorage.getItem("kestra_poker_name");
      if (savedName) {
        setPlayerName(savedName);
      }

      if (location.state?.isCreating) {
        setIsValidating(false);
        return;
      }

      const { data, error } = await supabase
        .from("poker_stories")
        .select("id")
        .eq("room_id", roomId)
        .limit(1);

      if (!error && data && data.length > 0) {
        setIsValidating(false);
      } else {
        navigate("/", {
          replace: true,
          state: {
            error: `Room '${roomId}' does not exist. Please create it first.`,
          },
        });
      }
    };

    checkRoomAccess();
  }, [roomId, location.state, navigate]);

  if (isValidating) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-500 animate-pulse text-sm">
          Validating room access...
        </p>
      </div>
    );
  }

  if (!playerName) {
    return (
      <Lobby
        initialRoomId={roomId}
        onJoin={(name, joinedRoomId, isCreating) => {
          localStorage.setItem("kestra_poker_name", name);
          localStorage.setItem("kestra_poker_room", joinedRoomId);
          setPlayerName(name);
          if (joinedRoomId !== roomId) {
            navigate(`/room/${joinedRoomId}`, { state: { isCreating } });
          }
        }}
      />
    );
  }

  const handleLeave = () => {
    setPlayerName(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-neutral-950 flex flex-col lg:overflow-hidden">
      <Board roomId={roomId!} playerName={playerName} onLeave={handleLeave} />
    </div>
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
