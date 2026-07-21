import React from "react";
import {
  RotateCcw,
  Save,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import type { VoteStat, TieInfo } from "../../utils/poker";

interface PlayerDeskStatsProps {
  isHost: boolean;
  finalValue: string;
  average: string;
  voteStats: VoteStat[];
  tieInfo: TieInfo;
  tiePreference: "higher" | "lower";
  setTiePreference: (pref: "higher" | "lower") => void;
  onSaveAndNext: (value: string) => void;
  onTriggerRevote: () => void;
}

export const PlayerDeskStats: React.FC<PlayerDeskStatsProps> = ({
  isHost,
  finalValue,
  average,
  voteStats,
  tieInfo,
  tiePreference,
  setTiePreference,
  onSaveAndNext,
  onTriggerRevote,
}) => {
  return (
    <div className="text-center transition-opacity duration-300 flex flex-col items-center gap-2 w-full">
      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onSaveAndNext(finalValue)}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider"
            >
              <Save className="w-3.5 h-3.5" />
              Save & Next
            </button>
            <button
              type="button"
              onClick={onTriggerRevote}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-700 transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-vote
            </button>
          </div>

          {tieInfo.isTie && (
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-xl text-xs mt-1 select-none animate-fadeIn">
              <span className="text-neutral-500 px-2 font-medium">
                Tie-break:
              </span>
              <button
                type="button"
                onClick={() => setTiePreference("lower")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  tiePreference === "lower"
                    ? "bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                }`}
              >
                <ArrowDown className="w-3 h-3" /> Lower ({tieInfo.lowest})
              </button>
              <button
                type="button"
                onClick={() => setTiePreference("higher")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  tiePreference === "higher"
                    ? "bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                }`}
              >
                <ArrowUp className="w-3 h-3" /> Higher ({tieInfo.highest})
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-1 min-h-[64px] flex flex-col justify-center items-center">
        {isHost ? (
          <>
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">
              Suggested Estimate
            </p>
            <p className="text-4xl font-bold text-emerald-400 font-sans tracking-tight my-0.5">
              {finalValue}
            </p>
          </>
        ) : tieInfo.isTie ? (
          <div className="my-1 animate-fadeIn text-center">
            <p className="text-amber-500 text-sm md:text-base font-extrabold mb-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 inline" /> Split vote (
              {tieInfo.lowest} vs {tieInfo.highest})
            </p>
            <p className="text-neutral-500 text-[10px] font-medium animate-pulse">
              ⏳ Awaiting host decision...
            </p>
          </div>
        ) : (
          <>
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">
              Suggested Estimate
            </p>
            <p className="text-4xl font-bold text-emerald-400 font-sans tracking-tight my-0.5">
              {finalValue}
            </p>
          </>
        )}
      </div>

      {voteStats.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-1">
          <div
            className="bg-emerald-500/10 px-2.5 py-1 rounded-md text-xs border border-emerald-500/20 flex items-center gap-1 font-mono text-emerald-400 font-bold shadow-sm"
            title="Exact mathematical average"
          >
            <span className="text-emerald-500/60 font-sans text-[10px] uppercase tracking-wider mr-0.5">
              avg
            </span>
            {average}
          </div>

          {voteStats.map((stat) => (
            <div
              key={stat.card}
              className="bg-neutral-900 px-2.5 py-1 rounded-md text-xs border border-neutral-800 flex items-center gap-1.5"
            >
              <span className="font-bold text-white">{stat.card}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-emerald-400">{stat.percentage}%</span>
              <span className="text-neutral-500">({stat.count})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
