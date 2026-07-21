import { useContext } from "react";
import { PokerContext } from "../context/PokerContext";

export const usePoker = () => {
  const context = useContext(PokerContext);
  if (!context) {
    throw new Error("usePoker must be used within a PokerProvider");
  }
  return context;
};