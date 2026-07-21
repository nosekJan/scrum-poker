import React, { useState, useEffect } from "react";
import { usePoker } from "../../hooks/usePoker";
import { myUserId, formatTime } from "../../hooks/usePokerGame";

type Tab = "active" | "completed" | "all";

export const StorySidebar: React.FC = () => {
  const [storyInput, setStoryInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    activeStory,
    completedStories,
    startStoryGrooming,
    storyStartTime,
    deleteStory,
    hostId,
  } = usePoker();

  const isHost = myUserId === hostId;

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

  const handleAddStory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storyInput.trim()) return;
    startStoryGrooming(storyInput.trim());
    setStoryInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAddStory();
    }
  };

  const handleCopyStory = (title: string, id: string) => {
    navigator.clipboard
      .writeText(title)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  };

  const handleDeleteStory = (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`,
    );
    if (confirmed) {
      deleteStory(id);
    }
  };

  const activeCount = activeStory ? 1 : 0;
  const completedCount = completedStories.length;
  const allCount = completedCount + activeCount;

  return (
    <div className="bg-neutral-900/60 border border-neutral-900/80 rounded-2xl p-5 flex flex-col w-full h-[380px] lg:h-full">
      <div className="flex border-b border-neutral-800 mb-4 text-xs font-semibold tracking-wide uppercase">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-2.5 px-2 relative transition-colors cursor-pointer ${activeTab === "active" ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          Active Stories{" "}
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${
              activeCount > 0
                ? "bg-emerald-500/20 text-emerald-400 animate-pulse font-bold"
                : activeTab === "active"
                  ? "bg-neutral-800 text-emerald-400/70"
                  : "bg-neutral-800 text-neutral-600"
            }`}
          >
            {activeCount}
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
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${
              activeTab === "completed"
                ? "bg-emerald-500/20 text-emerald-400 font-bold"
                : completedCount > 0
                  ? "bg-emerald-500/10 text-emerald-400/80"
                  : "bg-neutral-800 text-neutral-600"
            }`}
          >
            {completedCount}
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
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${
              activeTab === "all"
                ? "bg-emerald-500/20 text-emerald-400 font-bold"
                : allCount > 0
                  ? "bg-neutral-800 text-neutral-400"
                  : "bg-neutral-800 text-neutral-600"
            }`}
          >
            {allCount}
          </span>
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/30 [scrollbar-width:thin] [scrollbar-color:#262626_transparent]">
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
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Refactor authentication module in Core Application"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 min-h-[80px] resize-none"
                />
                <p className="text-[11px] text-neutral-600 text-left -mt-1 px-1 select-none">
                  {" "}
                  Tip: Press{" "}
                  <span className="font-mono bg-neutral-950 px-1 py-0.5 rounded border border-neutral-800/60">
                    Ctrl + Enter
                  </span>{" "}
                  to quick set
                </p>
                <button
                  type="submit"
                  disabled={!storyInput.trim()}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed cursor-pointer ${
                    !storyInput.trim()
                      ? "bg-neutral-800 border border-neutral-700 text-neutral-500"
                      : "bg-emerald-500 border border-emerald-400/20 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/10"
                  }`}
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
                      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 min-w-[20px]">
                        <button
                          type="button"
                          onClick={() => handleCopyStory(story.title, story.id)}
                          className={`p-1 rounded transition-colors cursor-pointer ${copiedId === story.id ? "text-emerald-400" : "text-emerald-500 hover:text-emerald-400"}`}
                          title="Copy story title"
                        >
                          {copiedId === story.id ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2.5}
                              stroke="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v10.5A2.25 2.25 0 004.5 18.75h2.25m7.5-10.5H19.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 22.5h-10.5a2.25 2.25 0 01-2.25-2.25V10.5a2.25 2.25 0 012.25-2.25z"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteStory(story.id, story.title)
                          }
                          className="text-neutral-500 hover:text-red-400 text-xs p-1 rounded transition-colors cursor-pointer font-mono leading-none flex items-center justify-center"
                          title="Delete story from database"
                        >
                          ✕
                        </button>
                      </div>
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
                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 min-w-[20px]">
                      <button
                        type="button"
                        onClick={() => handleCopyStory(story.title, story.id)}
                        className={`p-1 rounded transition-colors cursor-pointer ${copiedId === story.id ? "text-emerald-400" : "text-emerald-500 hover:text-emerald-400"}`}
                        title="Copy story title"
                      >
                        {copiedId === story.id ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v10.5A2.25 2.25 0 004.5 18.75h2.25m7.5-10.5H19.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 22.5h-10.5a2.25 2.25 0 01-2.25-2.25V10.5a2.25 2.25 0 012.25-2.25z"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStory(story.id, story.title)}
                        className="text-neutral-500 hover:text-red-400 text-xs p-1 rounded transition-colors cursor-pointer font-mono leading-none flex items-center justify-center"
                        title="Delete story from database"
                      >
                        ✕
                      </button>
                    </div>
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
  );
};
