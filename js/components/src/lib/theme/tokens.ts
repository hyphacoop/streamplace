/**
 * Design tokens for React Native components
 * Inspired by shadcn/ui but adapted for React Native styling
 */

export const colors = {
  // Primary colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  // Grayscale
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },

  // Semantic colors
  destructive: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },

  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },

  // iOS system colors (adaptive)
  ios: {
    systemBlue: "#007AFF",
    systemGreen: "#34C759",
    systemRed: "#FF3B30",
    systemOrange: "#FF9500",
    systemYellow: "#FFCC00",
    systemPurple: "#AF52DE",
    systemPink: "#FF2D92",
    systemTeal: "#5AC8FA",
    systemIndigo: "#5856D6",
    systemGray: "#8E8E93",
    systemGray2: "#AEAEB2",
    systemGray3: "#C7C7CC",
    systemGray4: "#D1D1D6",
    systemGray5: "#E5E5EA",
    systemGray6: "#F2F2F7",
  },

  // Android Material colors
  android: {
    primary: "#6200EE",
    primaryVariant: "#3700B3",
    secondary: "#03DAC6",
    secondaryVariant: "#018786",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    error: "#B00020",
    onPrimary: "#FFFFFF",
    onSecondary: "#000000",
    onBackground: "#000000",
    onSurface: "#000000",
    onError: "#FFFFFF",
  },

  // Transparent colors
  transparent: "transparent",
  black: "#000000",
  white: "#FFFFFF",
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 999,
} as const;

export const typography = {
  // iOS system font sizes
  ios: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: "700" as const,
    },
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "700" as const,
    },
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "700" as const,
    },
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "600" as const,
    },
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "600" as const,
    },
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "400" as const,
    },
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "400" as const,
    },
    subhead: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "400" as const,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "400" as const,
    },
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400" as const,
    },
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: "400" as const,
    },
  },

  // Android Material typography
  android: {
    headline1: {
      fontSize: 96,
      lineHeight: 112,
      fontWeight: "300" as const,
    },
    headline2: {
      fontSize: 60,
      lineHeight: 72,
      fontWeight: "300" as const,
    },
    headline3: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "400" as const,
    },
    headline4: {
      fontSize: 34,
      lineHeight: 42,
      fontWeight: "400" as const,
    },
    headline5: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "400" as const,
    },
    headline6: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "500" as const,
    },
    subtitle1: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
    },
    subtitle2: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "500" as const,
    },
    body1: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
    },
    body2: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400" as const,
    },
    button: {
      fontSize: 14,
      lineHeight: 16,
      fontWeight: "500" as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400" as const,
    },
    overline: {
      fontSize: 10,
      lineHeight: 16,
      fontWeight: "400" as const,
    },
  },

  // Universal typography scale
  universal: {
    xs: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400" as const,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400" as const,
    },
    base: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
    },
    lg: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: "400" as const,
    },
    xl: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "500" as const,
    },
    "2xl": {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600" as const,
    },
    "3xl": {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "700" as const,
    },
    "4xl": {
      fontSize: 36,
      lineHeight: 40,
      fontWeight: "700" as const,
    },
  },
} as const;

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Touch targets (iOS Human Interface Guidelines)
export const touchTargets = {
  minimum: 44, // Minimum touch target size
  comfortable: 48, // Comfortable touch target size
  large: 56, // Large touch target size
} as const;

// Animation durations
export const animations = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type TouchTargets = typeof touchTargets;
export type Animations = typeof animations;
export type Breakpoints = typeof breakpoints;
