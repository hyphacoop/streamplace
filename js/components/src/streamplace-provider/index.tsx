import { SessionManager } from "@atproto/api/dist/session-manager";
import { useEffect, useRef } from "react";
import { useGetChatProfile } from "../streamplace-store";
import { makeStreamplaceStore } from "../streamplace-store/streamplace-store";
import { StreamplaceContext } from "./context";
import Poller from "./poller";

export function StreamplaceProvider({
  children,
  url,
  oauthSession,
}: {
  children: React.ReactNode;
  url: string;
  oauthSession?: SessionManager | null;
}) {
  const getChatProfile = useGetChatProfile();
  // todo: handle url changes?
  const store = useRef(makeStreamplaceStore({ url })).current;

  useEffect(() => {
    store.setState({ url });
  }, [url]);

  useEffect(() => {
    store.setState({ oauthSession });
    // possibly their first login, trigger this so we create a chat profile record for them
    if (oauthSession) {
      getChatProfile();
    }
  }, [oauthSession]);

  return (
    <StreamplaceContext.Provider value={{ store: store }}>
      <Poller>{children}</Poller>
    </StreamplaceContext.Provider>
  );
}
