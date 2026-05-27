import React, { useState, useEffect } from "react";

interface LobbyProps {
  onJoin: (name: string, roomId: string) => void;
  initialRoomId?: string;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin, initialRoomId }) => {
  const [name, setName] = useState("");
  // Ak prišli cez priamy odkaz s ID (napr. z pozvánky), vyplníme to za nich.
  // Ak nie, necháme prázdne.
  const [roomId, setRoomId] = useState(initialRoomId || "");

  // Helper pre náhodný kód
  const generateRandomRoom = () => {
    const secureId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    setRoomId(secureId.substring(0, 30));
  };

  useEffect(() => {
    const savedName = localStorage.getItem("kestra_poker_name");
    if (savedName) setName(savedName);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoom = roomId.trim().toLowerCase().replace(/\s+/g, "-"); // Čistíme pre URL bezpečnosť

    if (trimmedName && trimmedRoom) {
      onJoin(trimmedName, trimmedRoom);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 px-4 font-sans">
      <div className="w-full max-w-md p-8 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Kestra Poker <span className="text-emerald-500">.</span>
          </h1>
          <p className="text-neutral-400">Join a planning session</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-1 relative">
            <div className="flex justify-between items-center ml-1 mb-1">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Room Name
              </label>
              <button
                type="button"
                onClick={generateRandomRoom}
                className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
              >
                Generate Random
              </button>
            </div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. carestation-team"
              maxLength={30}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !roomId.trim()}
            className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            Enter Room
          </button>
        </form>
      </div>
    </div>
  );
};
