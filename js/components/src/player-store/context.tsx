import { createContext } from "react";
import { PlayerStore } from "./player-store";

type PlayerContextType = {
  store: PlayerStore;
};

export const PlayerContext = createContext<PlayerContextType | null>(null);
