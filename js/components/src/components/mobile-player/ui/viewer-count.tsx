import { useMemo } from "react";
import { StyleSheet, TextStyle } from "react-native";
import { Text } from "../../ui/text";

export interface ViewerCountProps {
  count?: number | null;
  style?: TextStyle;
  locales?: Intl.LocalesArgument;
  numberFormat?: Intl.NumberFormatOptions;
}

export function ViewerCount({
  count,
  style = {},
  locales,
  numberFormat = { notation: "compact" },
}: ViewerCountProps) {
  const formattedNumber = useMemo(() => {
    return new Intl.NumberFormat(locales, numberFormat).format(count || 0);
  }, [numberFormat, count]);

  return <Text style={[styles.label, style]}>{formattedNumber}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: "#fd5050",
    textShadowColor: "black",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 3,
    fontSize: 16,
  },
});

export default ViewerCount;
