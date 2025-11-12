import { useNavigation } from "@react-navigation/native";
import { Text, View } from "@streamplace/components";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";

interface SettingsNavigationItemProps {
  title: string;
  screen: string;
  icon: LucideIcon;
}

export function SettingsNavigationItem({
  title,
  screen,
  icon: Icon,
}: SettingsNavigationItemProps) {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.navigate(screen as never)}>
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
