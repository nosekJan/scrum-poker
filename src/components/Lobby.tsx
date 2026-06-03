import React, { useState, useEffect } from "react";

interface LobbyProps {
  onJoin: (name: string, roomId: string, isCreating: boolean) => void;
  initialRoomId?: string;
  error?: string;
}

export const Lobby: React.FC<LobbyProps> = ({
  onJoin,
  initialRoomId,
  error,
}) => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState(() => {
    if (initialRoomId) return initialRoomId;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("room") || "";
  });
  const [copied, setCopied] = useState(false);
  const [roomHistory, setRoomHistory] = useState<string[]>([]);

  const generateRandomRoom = () => {
    const secureId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    setRoomId(secureId.substring(0, 30));
  };

  const handleCopy = async () => {
    if (!roomId.trim()) return;
    try {
      await navigator.clipboard.writeText(roomId.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem("kestra_poker_name");
    if (savedName) setName(savedName);

    const savedHistory = localStorage.getItem("kestra_poker_history");
    if (savedHistory) {
      try {
        const historyData = JSON.parse(savedHistory);
        setRoomHistory(historyData.slice(0, 3));
      } catch (e) {
        console.error("Failed to parse room history:", e);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomId = urlParams.get("room");

    if (initialRoomId) {
      setRoomId(initialRoomId);
    } else if (urlRoomId) {
      setRoomId(urlRoomId);
    } else {
      const savedRoom = localStorage.getItem("kestra_poker_room");
      if (savedRoom) setRoomId(savedRoom);
    }
  }, [initialRoomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoom = roomId.trim().toLowerCase().replace(/\s+/g, "-");

    if (trimmedName && trimmedRoom) {
      localStorage.setItem("kestra_poker_name", trimmedName);
      localStorage.setItem("kestra_poker_room", trimmedRoom);

      const updatedHistory = [
        trimmedRoom,
        ...roomHistory.filter((r) => r !== trimmedRoom),
      ].slice(0, 3);

      setRoomHistory(updatedHistory);
      localStorage.setItem(
        "kestra_poker_history",
        JSON.stringify(updatedHistory),
      );

      onJoin(trimmedName, trimmedRoom, true);
    }
  };

  const handleDeleteHistory = (roomToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = roomHistory.filter((r) => r !== roomToDelete);
    setRoomHistory(updatedHistory);
    localStorage.setItem(
      "kestra_poker_history",
      JSON.stringify(updatedHistory),
    );
  };

  const currentNormalizedRoom = roomId
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 px-4 font-sans relative overflow-hidden">
      <div className="w-full max-w-md p-8 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Kestra Poker <span className="text-emerald-500">.</span>
          </h1>
          <p className="text-neutral-400">Join a planning session</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-center text-sm text-red-400">
            {error}
          </div>
        )}

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

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1 mb-1">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Room Name
              </label>
              <button
                type="button"
                onClick={generateRandomRoom}
                className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold transition-colors cursor-pointer"
              >
                Generate Random
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. carestation-team"
                maxLength={30}
                className="w-full pl-4 pr-12 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm"
              />

              {roomId.trim() && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-3 p-2 text-neutral-500 hover:text-emerald-500 transition-colors cursor-pointer"
                  title="Copy room name"
                >
                  {copied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-500 animate-scaleIn"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !roomId.trim()}
            className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            Enter Room
          </button>
        </form>

        {roomHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-800/60 overflow-hidden">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 ml-1">
              Recent Rooms
            </p>
            <div className="flex flex-col gap-2">
              {roomHistory.map((room) => {
                const isActive = currentNormalizedRoom === room;

                return (
                  <div
                    key={room}
                    onClick={() => setRoomId(room)}
                    className={`group flex justify-between items-center px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                        : "bg-neutral-950 hover:bg-neutral-800/30 border-neutral-800/40"
                    }`}
                  >
                    <span
                      className={`text-sm font-mono truncate pr-4 transition-colors ${
                        isActive
                          ? "text-emerald-400 font-medium"
                          : "text-neutral-400 group-hover:text-neutral-200"
                      }`}
                    >
                      {room}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(room, e)}
                      className={`px-1.5 py-0.5 rounded transition-colors text-xs font-mono cursor-pointer ${
                        isActive
                          ? "text-emerald-600 hover:text-red-400"
                          : "text-neutral-600 hover:text-red-400"
                      }`}
                      title="Remove from history"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
