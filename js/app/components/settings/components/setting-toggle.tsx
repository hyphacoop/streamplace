import { Text, View } from "@streamplace/components";
import { mergeStyles } from "@streamplace/components/src/ui";
import { Switch, ViewStyle } from "react-native";

export interface SettingToggleProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
}

export function SettingToggle({
  title,
  description,
  value,
  onValueChange,
  style,
}: SettingToggleProps) {
  return (
    <View
      style={mergeStyles(
        { flexDirection: "row" },
        { alignItems: "flex-start" },
        { justifyContent: "flex-start" },
        style,
      )}
    >
      <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
        <Text size="xl">{title}</Text>
        {description && (
          <Text size="lg" color="muted">
            {description}
          </Text>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
