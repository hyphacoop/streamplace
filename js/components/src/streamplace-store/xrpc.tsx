import { useMemo } from "react";
import { StreamplaceAgent } from "streamplace";
import { useStreamplaceStore } from ".";

export function usePDSAgent(): StreamplaceAgent | null {
  const oauthSession = useStreamplaceStore((state) => state.oauthSession);

  // oauthsession is
  // - undefined when loading
  // - null when logged out, and
  // - SessionManager when logged in
  return useMemo(() => {
    if (!oauthSession) {
      if (oauthSession === undefined) return null;
      return new StreamplaceAgent("");
    }

    return new StreamplaceAgent(oauthSession);
  }, [oauthSession]);
}
