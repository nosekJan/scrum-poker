import React, { useState, useEffect, useMemo } from "react";
import { Card } from "./Card";
import type { CardValue } from "../types/poker";
import { usePokerGame, myUserId, formatTime } from "../hooks/usePokerGame";

interface BoardProps {
  roomId: string;
  playerName: string;
  onLeave: () => void;
}

type Tab = "active" | "completed" | "all";

export const Board: React.FC<BoardProps> = ({
  roomId,
  playerName,
  onLeave,
}) => {
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null);
  const [storyInput, setStoryInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [timerDisplay, setTimerDisplay] = useState("00:00");

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

  const {
    players,
    castVote,
    isRevealed,
    activeStory,
    completedStories,
    startStoryGrooming,
    saveAndNextStory,
    triggerRevote,
    storyStartTime,
    deleteStory,
    hostId,
    endSession,
    claimHostRole,
  } = usePokerGame(roomId, playerName, onLeave);

  const isHost = myUserId === hostId;

  useEffect(() => {
    if (!isRevealed) {
      setSelectedCard(null);
    }
  }, [isRevealed]);

  useEffect(() => {
    if (!activeStory || !storyStartTime) {
      setTimerDisplay("00:00");
      return;
    }
    const interval = setInterval(() => {
      setTimerDisplay(formatTime(Date.now() - storyStartTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStory, storyStartTime]);

  const handleCardClick = (value: CardValue) => {
    if (isRevealed) return;
    const newValue = selectedCard === value ? null : value;
    setSelectedCard(newValue);
    castVote(newValue);
  };

  const average = useMemo(() => {
    const validVotes = players
      .map((p) => p.selectedCard)
      .filter((val) => val !== null && val !== "?" && val !== "☕")
      .map((val) => parseFloat(val as string));
    if (validVotes.length === 0) return "0.0";
    return (
      validVotes.reduce((acc, curr) => acc + curr, 0) / validVotes.length
    ).toFixed(1);
  }, [players]);

  const voteStats = useMemo(() => {
    if (!isRevealed) return [];
    const stats: Record<string, number> = {};
    let totalVotes = 0;
    players.forEach((p) => {
      if (p.selectedCard) {
        stats[p.selectedCard] = (stats[p.selectedCard] || 0) + 1;
        totalVotes++;
      }
    });
    if (totalVotes === 0) return [];
    return Object.entries(stats)
      .map(([card, count]) => ({
        card,
        count,
        percentage: Math.round((count / totalVotes) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [players, isRevealed]);

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyInput.trim()) return;
    startStoryGrooming(storyInput.trim());
    setStoryInput("");
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-neutral-950 text-white">
      <header className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">
            Kestra Poker <span className="text-emerald-500">.</span>
          </h1>
          <div className="hidden sm:flex items-center px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-400">
            Room: <span className="text-white ml-2 font-mono">{roomId}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-neutral-400">
            Playing as <strong className="text-white">{playerName}</strong>
          </span>
          {!isHost && (
            <button
              onClick={claimHostRole}
              className="px-3 py-1.5 border border-emerald-900/50 bg-emerald-900/10 rounded-lg text-xs text-emerald-400 hover:bg-emerald-900/30 transition-colors cursor-pointer"
            >
              Claim Host
            </button>
          )}
          {isHost && (
            <button
              onClick={endSession}
              className="px-3 py-1.5 border border-red-900/50 bg-red-900/20 rounded-lg text-xs text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
            >
              End Session
            </button>
          )}
          <button
            onClick={onLeave}
            className="px-3 py-1.5 border border-neutral-700 rounded-lg text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-4 min-h-[140px] justify-center w-full">
            {isRevealed && (
              <>
                <div className="flex gap-4">
                  {isHost && (
                    <>
                      <button
                        onClick={() => saveAndNextStory(average)}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        Save & Next Story
                      </button>
                      <button
                        onClick={triggerRevote}
                        className="px-6 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        Re-vote
                      </button>
                    </>
                  )}
                </div>

                <div className="text-center transition-opacity duration-300 flex flex-col items-center gap-1">
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-0.5">
                      Average
                    </p>
                    <p className="text-4xl font-bold text-emerald-400">
                      {average}
                    </p>
                  </div>

                  {voteStats.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {voteStats.map((stat) => (
                        <div
                          key={stat.card}
                          className="bg-neutral-900 px-2.5 py-1 rounded-md text-xs border border-neutral-800 flex items-center gap-1.5"
                        >
                          <span className="font-bold text-white">
                            {stat.card}
                          </span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-emerald-400">
                            {stat.percentage}%
                          </span>
                          <span className="text-neutral-500">
                            ({stat.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {!isRevealed &&
              players.length > 0 &&
              !players.every((p) => p.selectedCard !== null) && (
                <p className="text-neutral-500 text-sm animate-pulse">
                  Waiting for all players to vote...
                </p>
              )}
          </div>

          <div className="flex flex-wrap content-start justify-center gap-6 mb-12 min-h-[180px] w-full">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-2.5"
              >
                <div
                  className={`w-14 h-20 rounded-xl border flex items-center justify-center transition-all duration-300 relative ${
                    player.selectedCard
                      ? isRevealed
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-neutral-900 border-neutral-800 text-neutral-600"
                  }`}
                >
                  {isRevealed && player.selectedCard ? (
                    <span className="font-bold text-lg">
                      {player.selectedCard}
                    </span>
                  ) : player.selectedCard ? (
                    "✔️"
                  ) : (
                    "🤔"
                  )}
                  {player.id === hostId && (
                    <span className="absolute -top-3.5 -right-3 text-lg transform rotate-12 drop-shadow-md">
                      👑
                    </span>
                  )}
                  {player.id === myUserId && (
                    <span className="absolute -top-2 -left-2 bg-neutral-800 border border-neutral-700 text-[9px] px-1.5 py-0.5 rounded-full text-neutral-400 font-bold uppercase tracking-wide">
                      You
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-neutral-400 max-w-[80px] truncate text-center">
                  {player.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-900 rounded-2xl p-5 flex flex-col h-[520px]">
          <div className="flex border-b border-neutral-800 mb-4 text-xs font-semibold tracking-wide uppercase">
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-2.5 px-2 relative transition-colors cursor-pointer ${activeTab === "active" ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Active Stories{" "}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}
              >
                {activeStory ? 1 : 0}
              </span>
              {activeTab === "active" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`pb-2.5 px-2 relative transition-colors cursor-pointer ${activeTab === "completed" ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Completed{" "}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}
              >
                {completedStories.length}
              </span>
              {activeTab === "completed" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2.5 px-2 relative transition-colors cursor-pointer ${activeTab === "all" ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              All Stories{" "}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "all" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}
              >
                {completedStories.length + (activeStory ? 1 : 0)}
              </span>
              {activeTab === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === "active" && (
              <div className="h-full flex flex-col justify-between">
                {activeStory ? (
                  <div className="bg-neutral-950 border border-neutral-800/60 rounded-xl p-4 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                        Grooming Now
                      </p>
                      <span className="text-emerald-400/80 font-mono text-xs">
                        {timerDisplay}
                      </span>
                    </div>
                    <h3 className="text-white text-sm font-semibold leading-relaxed break-words">
                      {activeStory}
                    </h3>
                  </div>
                ) : isHost ? (
                  <form
                    onSubmit={handleAddStory}
                    className="flex flex-col gap-3 mt-2"
                  >
                    <p className="text-xs text-neutral-400">
                      No active story. Put a new item on the table:
                    </p>
                    <textarea
                      value={storyInput}
                      onChange={(e) => setStoryInput(e.target.value)}
                      placeholder="e.g. Change Stability label in CareStation"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 min-h-[80px] resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      Set Active Story
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <p className="text-xs text-neutral-500 animate-pulse">
                      Waiting for the host to set an active story...
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div className="flex flex-col gap-2">
                {completedStories.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center mt-8">
                    No completed stories yet.
                  </p>
                ) : (
                  completedStories.map((story) => (
                    <div
                      key={story.id}
                      className="group bg-neutral-950/60 border border-neutral-900/80 rounded-xl p-3 flex justify-between items-center gap-3 transition-colors hover:bg-neutral-950"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">
                          {story.title}
                        </p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {story.createdAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {story.time}
                        </span>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-center min-w-[36px]">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {story.estimate}
                          </span>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => deleteStory(story.id)}
                            className="text-neutral-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100 font-mono"
                            title="Delete story from database"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "all" && (
              <div className="flex flex-col gap-2">
                {activeStory && (
                  <div className="bg-neutral-950 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {activeStory}
                      </p>
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {timerDisplay}
                      </span>
                      <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md text-neutral-500 text-xs min-w-[36px] text-center">
                        -
                      </div>
                    </div>
                  </div>
                )}
                {completedStories.map((story) => (
                  <div
                    key={story.id}
                    className="group bg-neutral-950/60 border border-neutral-900/80 rounded-xl p-3 flex justify-between items-center gap-3 transition-colors hover:bg-neutral-950"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {story.title}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {story.createdAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {story.time}
                      </span>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-center min-w-[36px]">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {story.estimate}
                        </span>
                      </div>
                      {isHost && (
                        <button
                          onClick={() => deleteStory(story.id)}
                          className="text-neutral-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100 font-mono"
                          title="Delete story from database"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!activeStory && completedStories.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center mt-8">
                    History is empty.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};
