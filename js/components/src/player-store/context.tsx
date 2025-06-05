import { createContext } from "react";
import { StoreApi } from "zustand";
import { PlayerState } from "./player-state";

type PlayerContextType = {
  players: Record<string, StoreApi<PlayerState>>;
  createPlayer: (id?: string) => string;
  removePlayer: (id: string) => void;
};

export const PlayerContext = createContext<PlayerContextType | null>(null);
