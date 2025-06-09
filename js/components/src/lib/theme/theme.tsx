import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform, useColorScheme } from "react-native";
import {
  animations,
  borderRadius,
  colors,
  shadows,
  spacing,
  touchTargets,
  typography,
} from "./tokens";

// Theme interfaces
export interface Theme {
  colors: {
    // Core semantic colors
    background: string;
    foreground: string;

    // Card/surface colors
    card: string;
    cardForeground: string;

    // Popover colors
    popover: string;
    popoverForeground: string;

    // Primary colors
    primary: string;
    primaryForeground: string;

    // Secondary colors
    secondary: string;
    secondaryForeground: string;

    // Muted colors
    muted: string;
    mutedForeground: string;

    // Accent colors
    accent: string;
    accentForeground: string;

    // Destructive colors
    destructive: string;
    destructiveForeground: string;

    // Success colors
    success: string;
    successForeground: string;

    // Warning colors
    warning: string;
    warningForeground: string;

    // Border and input colors
    border: string;
    input: string;
    ring: string;

    // Text colors
    text: string;
    textMuted: string;
    textDisabled: string;
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  touchTargets: typeof touchTargets;
  animations: typeof animations;
}

// Utility styles interface
export interface ThemeStyles {
  shadow: {
    sm: typeof shadows.sm;
    md: typeof shadows.md;
    lg: typeof shadows.lg;
    xl: typeof shadows.xl;
  };
  button: {
    primary: object;
    secondary: object;
    outline: object;
    ghost: object;
  };
  text: {
    primary: object;
    muted: object;
    disabled: object;
  };
  input: {
    base: object;
    focused: object;
    error: object;
  };
  card: {
    base: object;
  };
}

// Icon utilities interface
export interface ThemeIcons {
  color: {
    default: string;
    muted: string;
    primary: string;
    secondary: string;
    destructive: string;
    success: string;
    warning: string;
  };
  size: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Create theme colors based on dark mode
const createThemeColors = (isDark: boolean): Theme["colors"] => ({
  background: isDark ? colors.gray[950] : colors.white,
  foreground: isDark ? colors.gray[50] : colors.gray[950],

  card: isDark ? colors.gray[900] : colors.white,
  cardForeground: isDark ? colors.gray[50] : colors.gray[950],

  popover: isDark ? colors.gray[900] : colors.white,
  popoverForeground: isDark ? colors.gray[50] : colors.gray[950],

  primary: Platform.OS === "ios" ? colors.ios.systemBlue : colors.primary[500],
  primaryForeground: colors.white,

  secondary: isDark ? colors.gray[800] : colors.gray[100],
  secondaryForeground: isDark ? colors.gray[50] : colors.gray[900],

  muted: isDark ? colors.gray[800] : colors.gray[100],
  mutedForeground: isDark ? colors.gray[400] : colors.gray[500],

  accent: isDark ? colors.gray[800] : colors.gray[100],
  accentForeground: isDark ? colors.gray[50] : colors.gray[900],

  destructive:
    Platform.OS === "ios" ? colors.ios.systemRed : colors.destructive[500],
  destructiveForeground: colors.white,

  success: Platform.OS === "ios" ? colors.ios.systemGreen : colors.success[500],
  successForeground: colors.white,

  warning:
    Platform.OS === "ios" ? colors.ios.systemOrange : colors.warning[500],
  warningForeground: colors.white,

  border: isDark ? colors.gray[500] + "30" : colors.gray[200] + "30",
  input: isDark ? colors.gray[800] : colors.gray[200],
  ring: Platform.OS === "ios" ? colors.ios.systemBlue : colors.primary[500],

  text: isDark ? colors.gray[50] : colors.gray[950],
  textMuted: isDark ? colors.gray[400] : colors.gray[500],
  textDisabled: isDark ? colors.gray[600] : colors.gray[400],
});

// Create theme styles based on colors
const createThemeStyles = (themeColors: Theme["colors"]): ThemeStyles => ({
  shadow: {
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
    xl: shadows.xl,
  },
  button: {
    primary: {
      backgroundColor: themeColors.primary,
      borderWidth: 0,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: themeColors.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
  },
  text: {
    primary: {
      color: themeColors.text,
    },
    muted: {
      color: themeColors.textMuted,
    },
    disabled: {
      color: themeColors.textDisabled,
    },
  },
  input: {
    base: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      minHeight: touchTargets.minimum,
    },
    focused: {
      borderColor: themeColors.ring,
      borderWidth: 2,
    },
    error: {
      borderColor: themeColors.destructive,
      borderWidth: 2,
    },
  },
  card: {
    base: {
      backgroundColor: themeColors.card,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
    },
  },
});

// Create theme icons based on colors
const createThemeIcons = (themeColors: Theme["colors"]): ThemeIcons => ({
  color: {
    default: themeColors.text,
    muted: themeColors.textMuted,
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    destructive: themeColors.destructive,
    success: themeColors.success,
    warning: themeColors.warning,
  },
  size: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
});

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  styles: ThemeStyles;
  icons: ThemeIcons;
  isDark: boolean;
  currentTheme: "light" | "dark" | "system";
  systemTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  forcedTheme?: "light" | "dark";
}

// Theme provider component
export function ThemeProvider({
  children,
  defaultTheme = "system",
  forcedTheme,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">(
    defaultTheme,
  );

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (forcedTheme === "light") return false;
    if (forcedTheme === "dark") return true;
    if (currentTheme === "light") return false;
    if (currentTheme === "dark") return true;
    if (currentTheme === "system") return systemColorScheme === "dark";
    return systemColorScheme === "dark";
  }, [forcedTheme, currentTheme, systemColorScheme]);

  // Create theme based on dark mode
  const theme = useMemo<Theme>(() => {
    const themeColors = createThemeColors(isDark);
    return {
      colors: themeColors,
      spacing,
      borderRadius,
      typography,
      shadows,
      touchTargets,
      animations,
    };
  }, [isDark]);

  // Create utility styles
  const styles = useMemo<ThemeStyles>(() => {
    return createThemeStyles(theme.colors);
  }, [theme.colors]);

  // Create icon utilities
  const icons = useMemo<ThemeIcons>(() => {
    return createThemeIcons(theme.colors);
  }, [theme.colors]);

  // Theme controls
  const setTheme = (newTheme: "light" | "dark" | "system") => {
    if (!forcedTheme) {
      setCurrentTheme(newTheme);
    }
  };

  const toggleTheme = () => {
    if (!forcedTheme) {
      setCurrentTheme((prev) => {
        if (prev === "light") return "dark";
        if (prev === "dark") return "system";
        return "light";
      });
    }
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      styles,
      icons,
      isDark,
      currentTheme: forcedTheme || currentTheme,
      systemTheme: (systemColorScheme as "light" | "dark") || "light",
      setTheme,
      toggleTheme,
    }),
    [
      theme,
      styles,
      icons,
      isDark,
      forcedTheme,
      currentTheme,
      systemColorScheme,
      setTheme,
      toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Hook to get current platform's typography
export function usePlatformTypography() {
  const { theme } = useTheme();

  return useMemo(() => {
    if (Platform.OS === "ios") {
      return theme.typography.ios;
    } else if (Platform.OS === "android") {
      return theme.typography.android;
    }
    return theme.typography.universal;
  }, [theme.typography]);
}

// Utility function to create theme-aware styles
export function createThemedStyles<T extends Record<string, any>>(
  styleCreator: (theme: Theme, styles: ThemeStyles, icons: ThemeIcons) => T,
) {
  return function useThemedStyles() {
    const { theme, styles, icons } = useTheme();
    return useMemo(
      () => styleCreator(theme, styles, icons),
      [theme, styles, icons],
    );
  };
}

// Create light and dark theme instances for external use
export const lightTheme: Theme = {
  colors: createThemeColors(false),
  spacing,
  borderRadius,
  typography,
  shadows,
  touchTargets,
  animations,
};

export const darkTheme: Theme = {
  colors: createThemeColors(true),
  spacing,
  borderRadius,
  typography,
  shadows,
  touchTargets,
  animations,
};

// Export individual theme utilities for convenience
export { createThemeColors, createThemeIcons, createThemeStyles };
