import { createAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../../hooks/createSlice";
import { uuidv7 } from "hooks/uuid";
import { createContext, useContext } from "react";
import { StreamplaceState } from "features/streamplace/streamplaceSlice";

export interface PlayerContextType {
  playerId: string | null;
}

export const PlayerContext = createContext<PlayerContextType>({
  playerId: null,
});

export interface PlayerState {
  ingestStarted: number | null;
  ingestStarting: boolean;
  ingestConnectionState: RTCPeerConnectionState | null;
  viewers: number | null;
}

export interface PlayersState {
  [key: string]: PlayerState;
}

const initialState: PlayersState = {};

export const newPlayer = createAction("player/newPlayer", function prepare() {
  return {
    payload: { playerId: uuidv7() },
  };
});

const usePlayerId = () => {
  const { playerId } = useContext(PlayerContext);
  if (!playerId) {
    throw new Error("Player context not found");
  }
  return playerId;
};

export const playerSlice = createAppSlice({
  name: "player",
  initialState,

  extraReducers: (builder) => {
    builder.addCase(newPlayer, (state, action) => {
      state[action.payload.playerId] = {
        ingestStarted: null,
        ingestStarting: false,
        ingestConnectionState: null,
        viewers: null,
      };
    });
  },

  reducers: (create) => {
    return {
      startIngest: create.reducer(
        (
          state,
          action: {
            payload: { playerId: string; startIngest: boolean };
            type: string;
          },
        ) => {
          return {
            ...state,
            [action.payload.playerId]: {
              ...state[action.payload.playerId],
              ingestStarting: action.payload.startIngest,
            },
          };
        },
      ),

      ingestConnectionState: create.reducer(
        (
          state,
          action: {
            payload: {
              playerId: string;
              ingestConnectionState: RTCPeerConnectionState;
            };
            type: string;
          },
        ) => {
          return {
            ...state,
            [action.payload.playerId]: {
              ...state[action.payload.playerId],
              ingestConnectionState: action.payload.ingestConnectionState,
            },
          };
        },
      ),

      pollViewers: create.asyncThunk(
        async (
          { playerId, user }: { playerId: string; user: string },
          { getState },
        ) => {
          const { streamplace } = getState() as {
            streamplace: StreamplaceState;
          };
          const res = await fetch(`${streamplace.url}/api/view-count/${user}`);
          const data = await res.json();
          return { playerId, count: data.count };
        },
        {
          pending: (state) => {
            // state.status = "loading";
          },
          fulfilled: (state, result) => {
            return {
              ...state,
              [result.payload.playerId]: {
                ...state[result.payload.playerId],
                viewers: result.payload.count,
              },
            };
          },
          rejected: (state, error) => {
            console.error("pollViewers rejected", error);
            return state;
          },
        },
      ),
    };
  },

  selectors: {
    selectPlayer: (state, playerId: string) => {
      return state[playerId];
    },
  },
});

export const usePlayerActions = () => {
  const playerId = usePlayerId();
  return {
    startIngest: (startIngest: boolean) =>
      playerSlice.actions.startIngest({ playerId, startIngest }),
    ingestConnectionState: (ingestConnectionState: RTCPeerConnectionState) => {
      console.log("ingestConnectionState", ingestConnectionState);
      return playerSlice.actions.ingestConnectionState({
        playerId,
        ingestConnectionState,
      });
    },
    pollViewers: (user: string) =>
      playerSlice.actions.pollViewers({ playerId, user }),
  };
};

// Action creators are generated for each case reducer function.
export const { selectPlayer } = playerSlice.selectors;
export const usePlayer = () => {
  const playerId = usePlayerId();
  return (state) => state.player[playerId];
};
