import { ActivityIndicator as RNActivityIndicator } from "react-native";
import { useTheme } from "../../lib/theme";

export function Loader(
  props: React.ComponentPropsWithoutRef<typeof RNActivityIndicator>,
) {
  const { theme } = useTheme();
  return <RNActivityIndicator color={theme.colors.primary} {...props} />;
}
