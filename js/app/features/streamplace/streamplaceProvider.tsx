import Loading from "components/loading/loading";
import { createContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Text, View } from "tamagui";
import {
  DEFAULT_URL,
  initialize,
  selectInitialized,
  selectUrl,
} from "./streamplaceSlice";

export const StreamplaceContext = createContext({
  url: DEFAULT_URL,
});

export default function StreamplaceProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const url = useAppSelector(selectUrl);
  const initialized = useAppSelector(selectInitialized);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!initialized) {
      dispatch(initialize());
    }
  }, [initialized]);
  if (!initialized) {
    return (
      <View f={1}>
        <Text>StreamplaceProvider loading...</Text>
        <Loading />
      </View>
    );
  }
  return (
    <StreamplaceContext.Provider value={{ url: url }}>
      {children}
    </StreamplaceContext.Provider>
  );
}
