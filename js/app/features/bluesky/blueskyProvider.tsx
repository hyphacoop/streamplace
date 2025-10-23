import { useURL } from "expo-linking";
import { useEffect, useState } from "react";
import { useStore } from "store";
import { useIsReady, useOAuthSession, useUserProfile } from "store/hooks";

export default function BlueskyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadOAuthClient = useStore((state) => state.loadOAuthClient);
  const oauthCallback = useStore((state) => state.oauthCallback);
  const getProfile = useStore((state) => state.getProfile);
  const isReady = useIsReady();

  useEffect(() => {
    loadOAuthClient();
  }, []);

  useEffect(() => {
    if (!isReady) {
      const handle = setInterval(() => {
        loadOAuthClient();
      }, 5000);
      return () => clearInterval(handle);
    }
  }, [isReady]);

  const oauthSession = useOAuthSession();
  const userProfile = useUserProfile();

  const [lastLink, setLastLink] = useState<string | null>(null);
  const url = useURL();

  useEffect(() => {
    if (url !== lastLink && url) {
      setLastLink(url);
      if (url.includes("?")) {
        const params = new URLSearchParams(url.split("?")[1]);
        if (params.has("error") || params.has("code")) {
          oauthCallback(url);
        }
      }
    }
  }, [url, lastLink]);

  useEffect(() => {
    if (oauthSession && !userProfile) {
      getProfile(oauthSession.did);
    }
  }, [oauthSession, userProfile]);

  return <>{children}</>;
}
