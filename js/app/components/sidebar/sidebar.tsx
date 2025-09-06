import { DrawerNavigationOptions } from "@react-navigation/drawer";
import { DrawerDescriptorMap } from "@react-navigation/drawer/lib/typescript/src/types";
import {
  CommonActions,
  DrawerNavigationState,
  ParamListBase,
} from "@react-navigation/native";
import { Text, useTheme } from "@streamplace/components";
import React from "react";
import { Image, Platform, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import SidebarItem from "./sidebar-item";

export interface ExternalDrawerItem {
  item:
    | React.ComponentType<any>
    | React.ReactElement
    | (() => React.ReactElement);
  label: React.ComponentType<any> | React.ReactElement | string;
  onPress: () => void;
}

interface CustomSidebarProps {
  collapsed: boolean;
  hidden: boolean;
  widthAnim: SharedValue<number>;
  descriptors: DrawerDescriptorMap;
  state: DrawerNavigationState<ParamListBase>;
  externalItems?: ExternalDrawerItem[];
}

// Combine standard drawer props with custom props
type SidebarProps = CustomSidebarProps & DrawerNavigationOptions;

export default function Sidebar({
  state,
  descriptors,
  collapsed,
  hidden,
  widthAnim,
  externalItems = [],
}: SidebarProps) {
  const theme = useTheme();
  // Apply the defined type to the component props
  const animatedSidebarStyle = useAnimatedStyle(() => {
    return {
      minWidth: widthAnim.value,
      maxWidth: widthAnim.value,
    };
  });

  if (hidden) {
    return <View />;
  }

  return (
    <Animated.View
      style={[
        animatedSidebarStyle, // Apply the animated style
        { padding: 8, gap: 8, flexDirection: "column" },
      ]}
    >
      <View
        style={[
          {
            marginTop: Platform.OS === "ios" ? 29 : 12,
            marginBottom: 20,
            paddingLeft: 10,
            gap: 12,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
          },
        ]}
      >
        <Image
          source={require("../../assets/images/cube.png")}
          style={[{ height: 30, width: 28 }]}
        />
        {!collapsed && <Text size="2xl">Streamplace</Text>}
      </View>

      {state.routes.map((route) => {
        const descriptor = descriptors[route.key];
        const options = descriptor?.options ?? {};

        const label =
          typeof options.drawerLabel === "function"
            ? options.drawerLabel({ focused: false, color: "$color" })
            : (options.drawerLabel ?? options.title ?? route.name);

        const IconComponent = options.drawerIcon as
          | React.ComponentType<any>
          | undefined;

        return (
          <SidebarItem
            key={route.key}
            icon={IconComponent ? IconComponent : () => <Text>📄</Text>}
            label={label}
            active={descriptor.navigation.isFocused()}
            collapsed={collapsed}
            onPress={() => {
              if (route.name === "Home") {
                // copy logic for 'Home' to reset the stack
                descriptor.navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: "Home",
                        state: {
                          routes: [{ name: "StreamList" }],
                        },
                      },
                    ],
                  }),
                );
              } else {
                descriptor.navigation.navigate(route.name);
              }
            }}
            style={options.drawerItemStyle}
            tint={options.drawerActiveTintColor as string} // Assuming tint is a string color or undefined
          />
        );
      })}
      {externalItems.map((i, num) => {
        // Handle different label types - string, JSX element, or component
        const renderLabel = () => {
          if (typeof i.label === "string") {
            return i.label;
          }

          // If it's already a JSX element, return it directly
          if (React.isValidElement(i.label)) {
            return i.label;
          }

          // If it's a function (component), call it
          if (typeof i.label === "function") {
            const LabelComponent = i.label;
            return <LabelComponent />;
          }

          // Fallback
          return "Item";
        };

        return (
          <SidebarItem
            key={num}
            icon={i.item}
            label={renderLabel()}
            active={false}
            collapsed={collapsed}
            onPress={() => i.onPress()}
            tint="rgba(189, 110, 134)"
          />
        );
      })}
    </Animated.View>
  );
}
