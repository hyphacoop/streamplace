import { Text } from "@streamplace/components";
import Loading from "components/loading/loading";
import { createContext, useEffect } from "react";
import { View } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
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
      <View style={[{ flex: 1 }]}>
        <Text style={[{ color: "#fff" }]}>StreamplaceProvider loading...</Text>
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
