import { forwardRef, ReactNode } from "react";
import { Platform, View, ViewStyle } from "react-native";
import {
  a,
  borderRadius,
  fontSize,
  gap,
  mt,
  mx,
  p,
  pb,
  pl,
  pr,
  pt,
  px,
  py,
} from "../../lib/theme/atoms";
import { mergeStyles, useTheme } from "../../ui";
import { Text } from "./text";

export interface MenuContainerProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const MenuContainer = forwardRef<View, MenuContainerProps>(
  ({ children, style }, ref) => {
    const { theme } = useTheme();
    return (
      <View ref={ref} style={[gap.all[4], mt[4], mx[2], style]}>
        {children}
      </View>
    );
  },
);

export interface MenuGroupProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const MenuGroup = forwardRef<View, MenuGroupProps>(
  ({ children, style }, ref) => {
    const { theme } = useTheme();
    return (
      <View
        ref={ref}
        style={[
          { backgroundColor: theme.colors.muted + "c0" },
          Platform.OS === "web" ? [px[1], py[1]] : p[1],
          gap.all[1],
          { borderRadius: borderRadius.lg },
          style,
        ]}
      >
        {children}
      </View>
    );
  },
);

export interface MenuItemProps {
  children: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const MenuItem = forwardRef<View, MenuItemProps>(
  ({ children, disabled, style }, ref) => {
    const { theme } = useTheme();
    return (
      <View
        ref={ref}
        style={[
          a.layout.flex.row,
          a.layout.flex.alignCenter,
          a.radius.all.sm,
          py[1],
          pl[3],
          pr[2],
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {typeof children === "string" ? (
          <Text style={{ color: theme.colors.popoverForeground }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  },
);

export interface MenuLabelProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const MenuLabel = forwardRef<View, MenuLabelProps>(
  ({ children, style }, ref) => {
    const { theme } = useTheme();
    return (
      <Text
        ref={ref as any}
        style={mergeStyles(
          px[4],
          py[2],
          { color: theme.colors.textMuted },
          a.fontSize.base,
          style,
        )}
      >
        {children}
      </Text>
    );
  },
);

export interface MenuSeparatorProps {
  style?: ViewStyle;
}

export const MenuSeparator = forwardRef<View, MenuSeparatorProps>(
  ({ style }, ref) => {
    const { theme } = useTheme();
    return (
      <View
        ref={ref}
        style={[
          mx[2],
          {
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 0,
          },
          style,
        ]}
      />
    );
  },
);

export interface MenuInfoProps {
  description: string;
  style?: ViewStyle;
}

export const MenuInfo = forwardRef<View, MenuInfoProps>(
  ({ description, style }, ref) => {
    const { theme } = useTheme();
    return (
      <Text
        ref={ref as any}
        style={mergeStyles(
          { color: theme.colors.textMuted, marginTop: -8 },
          pt[1],
          pl[4],
          pb[2],
          fontSize.sm,
          style,
        )}
      >
        {description}
      </Text>
    );
  },
);
