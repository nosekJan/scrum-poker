import React, { useState, useEffect } from "react";
import { CHANGELOG, CURRENT_VERSION } from "../data/changelogData";

export const Changelog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem("scrum_poker_last_seen_version");
    if (lastSeen !== CURRENT_VERSION) {
      setHasUnread(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
    localStorage.setItem("scrum_poker_last_seen_version", CURRENT_VERSION);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/40 border border-neutral-800/60 hover:border-emerald-500/30 hover:bg-neutral-900/90 text-neutral-400 hover:text-emerald-400 text-[10px] font-medium tracking-wide transition-all cursor-pointer backdrop-blur-sm shadow-lg"
      >
        <span className="font-mono">v{CURRENT_VERSION}</span>
        <span className="w-[1px] h-2.5 bg-neutral-800" />
        <span>What's new?</span>
        {hasUnread && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  What's new in Scrum Poker 🚀
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Latest features, improvements, and fixes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer w-6 h-6 flex items-center justify-center rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-thin">
              {CHANGELOG.map((item, index) => {
                const features = item.changes.filter(
                  (c) => c.type === "feature",
                );
                const improvements = item.changes.filter(
                  (c) => c.type === "improvement",
                );
                const fixes = item.changes.filter((c) => c.type === "fix");

                return (
                  <div
                    key={item.version}
                    className="relative pl-6 border-l border-neutral-800"
                  >
                    <div
                      className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-neutral-900 ${
                        index === 0
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-neutral-700"
                      }`}
                    />

                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-sm font-bold font-mono text-white">
                        v{item.version}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {item.date}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-emerald-400 mb-5">
                      {item.title}
                    </h3>

                    <div className="space-y-5">
                      {features.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-1.5">
                            <span>🚀</span> Added
                          </h4>
                          <ul className="space-y-1.5">
                            {features.map((change, i) => (
                              <li
                                key={i}
                                className="text-xs text-neutral-300 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-600"
                              >
                                {change.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {improvements.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                            <span>🛠️</span> Improved
                          </h4>
                          <ul className="space-y-1.5">
                            {improvements.map((change, i) => (
                              <li
                                key={i}
                                className="text-xs text-neutral-300 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-600"
                              >
                                {change.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fixes.length > 0 && (
                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                            <span>🐛</span> Fixed
                          </h4>
                          <ul className="space-y-1.5">
                            {fixes.map((change, i) => (
                              <li
                                key={i}
                                className="text-xs text-neutral-300 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-600"
                              >
                                {change.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-neutral-800/80 bg-neutral-950/40 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
              >
                Got it, awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
