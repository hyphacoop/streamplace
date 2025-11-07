import { useNavigation } from "@react-navigation/native";
import { Text, View } from "@streamplace/components";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";

interface SettingsItemLinkProps {
  title: string;
  screen: string;
  icon: LucideIcon;
  rootScreen?: boolean; // if true, navigates to root stack instead of Settings stack
}

export function SettingsItemLink({
  title,
  screen,
  icon: Icon,
  rootScreen = false,
}: SettingsItemLinkProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (rootScreen) {
      // Navigate to root stack screen
      navigation.navigate(screen as never);
    } else {
      // Navigate within Settings stack
      navigation.navigate(screen as never);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: pressed ? "#ffffff08" : "transparent",
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Icon size={20} color="#999" />
            <Text size="lg">{title}</Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </View>
      )}
    </Pressable>
  );
}
