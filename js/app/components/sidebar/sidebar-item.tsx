import { FileQuestion } from "@tamagui/lucide-icons";
import { Text, View, AnimatePresence } from "tamagui";
import { Pressable } from "react-native-gesture-handler";
import { useState } from "react";

export default function SidebarItem({
  icon,
  label,
  collapsed,
  active,
  onPress,
  style,
  tint,
}) {
  const [hover, setHover] = useState<boolean>(false);
  return (
    <Pressable
      onPress={onPress}
      style={style}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      role="button"
    >
      <View
        backgroundColor={
          hover || active
            ? tint.replace(
                ")",
                ", " + (active && !hover ? "0.1" : "0.25") + ")",
              )
            : undefined
        }
        borderRadius="$radius.3"
        flexDirection="row"
        justifyContent="flex-start"
        alignItems="center"
        paddingHorizontal="$3"
        gap="$2"
        overflow="hidden"
      >
        <View width="$3" paddingVertical="$3">
          {icon ? (
            icon({ color: "$color" })
          ) : (
            <FileQuestion color="$color" alignSelf="center" />
          )}
        </View>
        <AnimatePresence>
          {!collapsed && (
            <Text
              // setting to maximum width of the sidebar
              // so we don't get collapsing text on collapse
              minWidth={270}
              fontSize="$6"
              textAlign="left"
              animation="quick"
              enterStyle={{ opacity: 0, width: "100vw" }}
              exitStyle={{ opacity: 0, width: "100vw" }}
              animateOnly={["opacity"]}
            >
              {label}
            </Text>
          )}
        </AnimatePresence>
      </View>
    </Pressable>
  );
}
