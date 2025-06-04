import { makePlayerStore, PlayerContext } from "../player-store";

export function PlayerProvider(props: any) {
  // init the store
  let store = makePlayerStore();
  return (
    <PlayerContext.Provider value={{ store: store }}>
      {props.children}
    </PlayerContext.Provider>
  );
}
