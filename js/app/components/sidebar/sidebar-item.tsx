import { Text, useTheme } from "@streamplace/components";
import React, { ReactNode, useState } from "react";
import {
  PressableStateCallbackType,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";

export default function SidebarItem({
  icon,
  label,
  collapsed,
  active,
  onPress,
  style = null,
  tint = "rgba(189, 110, 134)",
}: {
  icon:
    | React.ComponentType<any>
    | React.ReactElement
    | (() => React.ReactElement);
  label: string | ReactNode;
  collapsed: boolean;
  active: boolean;
  onPress: () => void;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  tint: string;
}) {
  const [hover, setHover] = useState<boolean>(false);
  const theme = useTheme();

  // Handle different icon types - component, JSX element, or function returning JSX
  const renderIcon = () => {
    if (!icon) {
      return <Text>📄</Text>; // Default fallback
    }

    // Get theme color for icons - use theme colors if available, fallback to white
    const iconColor = theme?.theme?.colors?.foreground || "#ffffff";

    // If it's already a JSX element, clone it with theme color
    if (React.isValidElement(icon)) {
      // Clone the element and override the color prop
      return React.cloneElement(icon as any, {
        color: iconColor,
        size: 20, // Ensure consistent sizing
      });
    }

    // If it's a function (component), call it with theme color
    if (typeof icon === "function") {
      const IconComponent = icon;
      return <IconComponent color={iconColor} size={20} />;
    }
    if ((icon as any).$$typeof === Symbol.for("react.memo")) {
      const MemoizedIcon = (icon as any).type;
      return <MemoizedIcon color={iconColor} size={20} />;
    }

    // Fallback
    console.log("tried to render item, but couldn't", (icon as any).$$typeof);

    return <Text>📄</Text>;
  };

  return (
    <Pressable
      onPress={onPress}
      style={style}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
    >
      <View
        style={[
          {
            backgroundColor:
              hover || active
                ? tint.replace(
                    ")",
                    ", " + (active && !hover ? "0.1" : "0.25") + ")",
                  )
                : undefined,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingHorizontal: 12,
            gap: 8,
            overflow: "hidden",
          },
        ]}
      >
        <View style={[{ width: 32, paddingVertical: 12 }]}>{renderIcon()}</View>
        {!collapsed && (
          <View
            style={[
              {
                minWidth: 270,
                maxHeight: "auto",
                opacity: collapsed ? 0 : 1,
              },
            ]}
          >
            <Text style={[{ fontSize: 24, textAlign: "left", color: "#fff" }]}>
              {label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
