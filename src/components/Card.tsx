import React from "react";
import type { CardValue } from "../types/poker";

interface CardProps {
  value: CardValue;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  value,
  isSelected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-16 h-24 md:w-20 md:h-32 
        rounded-xl font-bold text-xl md:text-2xl
        flex items-center justify-center
        cursor-pointer select-none
        transition-all duration-200 ease-out
        border-2
        
        ${
          disabled
            ? "bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed opacity-50"
            : isSelected
              ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 -translate-y-2"
              : "bg-neutral-800 border-neutral-700 text-neutral-200 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-lg"
        }
      `}
    >
      {/* Vizuálny detail v strede karty pre prémiovejší look */}
      <span
        className={
          isSelected
            ? "text-white"
            : "text-emerald-500/80 group-hover:text-emerald-400"
        }
      >
        {value}
      </span>

      {/* Malé značky v rohoch pre klasický kartový dizajn */}
      <span className="absolute top-2 left-2 text-xs opacity-40">{value}</span>
      <span className="absolute bottom-2 right-2 text-xs opacity-40 rotate-180">
        {value}
      </span>
    </button>
  );
};
