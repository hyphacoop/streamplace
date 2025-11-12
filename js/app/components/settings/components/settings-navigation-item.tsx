import { useNavigation } from "@react-navigation/native";
import { Text, View, zero } from "@streamplace/components";
import { ChevronRight, ExternalLink, LucideIcon } from "lucide-react-native";
import { Linking, Pressable } from "react-native";

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
            zero.px[3],
            zero.py[2],
            zero.layout.flex.row,
            zero.layout.flex.justify.between,
            zero.layout.flex.align.center,
            zero.r.md,
            {
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

interface SettingsRowItemProps {
  children?: React.ReactNode;
}

export function SettingsRowItem({ children }: SettingsRowItemProps) {
  const navigation = useNavigation();

  return (
    <View
      style={[
        zero.px[3],
        zero.py[2],
        zero.layout.flex.row,
        zero.layout.flex.justify.between,
        zero.layout.flex.align.center,
        zero.r.md,
      ]}
    >
      {children}
    </View>
  );
}

interface SettingsExternalItemProps {
  title: string;
  link: string;
}

export function SettingsExternalItem({
  title,
  link,
}: SettingsExternalItemProps) {
  return (
    <Pressable onPress={() => Linking.openURL(link)}>
      {({ pressed }) => (
        <View
          style={[
            zero.px[3],
            zero.py[2],
            zero.layout.flex.row,
            zero.layout.flex.justify.between,
            zero.layout.flex.align.center,
            zero.r.md,
            {
              backgroundColor: pressed ? "#ffffff08" : "transparent",
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text size="lg">{title}</Text>
          </View>
          <ExternalLink size={20} color="#666" />
        </View>
      )}
    </Pressable>
  );
}
