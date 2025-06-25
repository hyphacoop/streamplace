/**
 * Type definitions for enhanced atoms with pairify function
 * Provides comprehensive type safety for array-style syntax
 */

import type { TextStyle, ViewStyle } from "react-native";
import type { BorderRadius, Colors, Spacing } from "./tokens";

// Base style value type
export type StyleValue = ViewStyle | TextStyle;

// Pairified structure types
export type PairifiedSpacing = {
  [K in keyof Spacing]: StyleValue;
};

export type PairifiedColors = {
  [K in keyof Colors]: K extends string
    ? Colors[K] extends Record<string, any>
      ? { [N in keyof Colors[K]]: StyleValue }
      : StyleValue
    : never;
};

export type PairifiedBorderRadius = {
  [K in keyof BorderRadius]: StyleValue;
};

// Border utilities types
export type BorderWidthAtoms = {
  thin: StyleValue;
  medium: StyleValue;
  thick: StyleValue;
};

export type BorderStyleAtoms = {
  solid: StyleValue;
  dashed: StyleValue;
  dotted: StyleValue;
};

export type BorderSideAtoms = {
  width: BorderWidthAtoms;
  color: PairifiedColors;
};

export type BorderAtoms = {
  width: BorderWidthAtoms;
  style: BorderStyleAtoms;
  color: PairifiedColors;
  top: BorderSideAtoms;
  bottom: BorderSideAtoms;
  left: BorderSideAtoms;
  right: BorderSideAtoms;
};

// Spacing atoms types
export type SpacingAtoms = {
  margin: PairifiedSpacing;
  marginTop: PairifiedSpacing;
  marginRight: PairifiedSpacing;
  marginBottom: PairifiedSpacing;
  marginLeft: PairifiedSpacing;
  marginHorizontal: PairifiedSpacing;
  marginVertical: PairifiedSpacing;
  padding: PairifiedSpacing;
  paddingTop: PairifiedSpacing;
  paddingRight: PairifiedSpacing;
  paddingBottom: PairifiedSpacing;
  paddingLeft: PairifiedSpacing;
  paddingHorizontal: PairifiedSpacing;
  paddingVertical: PairifiedSpacing;
};

// Border radius atoms types
export type RadiusAtoms = {
  all: PairifiedBorderRadius;
  top: PairifiedBorderRadius;
  topRight: PairifiedBorderRadius;
  bottom: PairifiedBorderRadius;
  bottomRight: PairifiedBorderRadius;
  left: PairifiedBorderRadius;
  right: PairifiedBorderRadius;
};

export type PercentSizeValues = {
  10: StyleValue;
  20: StyleValue;
  25: StyleValue;
  30: StyleValue;
  33: StyleValue;
  40: StyleValue;
  50: StyleValue;
  60: StyleValue;
  66: StyleValue;
  70: StyleValue;
  75: StyleValue;
  80: StyleValue;
  90: StyleValue;
  100: StyleValue;
};

// Size utilities types
export type SizeAtoms = {
  width: PairifiedSpacing & { percent: PercentSizeValues };
  height: PairifiedSpacing & { percent: PercentSizeValues };
  minWidth: PairifiedSpacing & { percent: PercentSizeValues };
  minHeight: PairifiedSpacing & { percent: PercentSizeValues };
  maxWidth: PairifiedSpacing & { percent: PercentSizeValues };
  maxHeight: PairifiedSpacing & { percent: PercentSizeValues };
};

// Flex utilities types
export type FlexValues = {
  0: StyleValue;
  1: StyleValue;
  2: StyleValue;
  3: StyleValue;
  4: StyleValue;
  5: StyleValue;
};

export type FlexGrowShrinkValues = {
  0: StyleValue;
  1: StyleValue;
};

export type FlexAtoms = {
  values: FlexValues;
  grow: FlexGrowShrinkValues;
  shrink: FlexGrowShrinkValues;
  basis: PairifiedSpacing & PercentSizeValues & { auto: StyleValue };
};

// Opacity utilities types
export type OpacityAtoms = {
  0: StyleValue;
  5: StyleValue;
  10: StyleValue;
  20: StyleValue;
  25: StyleValue;
  30: StyleValue;
  40: StyleValue;
  50: StyleValue;
  60: StyleValue;
  70: StyleValue;
  75: StyleValue;
  80: StyleValue;
  90: StyleValue;
  95: StyleValue;
  100: StyleValue;
};

// Z-index utilities types
export type ZIndexAtoms = {
  0: StyleValue;
  10: StyleValue;
  20: StyleValue;
  30: StyleValue;
  40: StyleValue;
  50: StyleValue;
  auto: StyleValue;
};

// Overflow utilities types
export type OverflowAtoms = {
  visible: StyleValue;
  hidden: StyleValue;
  scroll: StyleValue;
};

// Text alignment utilities types
export type TextAlignAtoms = {
  left: StyleValue;
  center: StyleValue;
  right: StyleValue;
  justify: StyleValue;
  auto: StyleValue;
};

// Font weight utilities types
export type FontWeightAtoms = {
  thin: StyleValue;
  extralight: StyleValue;
  light: StyleValue;
  normal: StyleValue;
  medium: StyleValue;
  semibold: StyleValue;
  bold: StyleValue;
  extrabold: StyleValue;
  black: StyleValue;
};

// Layout utilities types
export type LayoutAtoms = {
  flex: {
    center: StyleValue;
    row: StyleValue;
    column: StyleValue;
    spaceBetween: StyleValue;
    spaceAround: StyleValue;
    spaceEvenly: StyleValue;
  };
  position: {
    absolute: StyleValue;
    relative: StyleValue;
  };
};

// Icon sizes types
export type IconSizeAtoms = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

// Typography atoms types
export type TypographyAtoms = {
  platform: Record<string, StyleValue>;
  universal: Record<string, StyleValue>;
  ios: Record<string, StyleValue>;
  android: Record<string, StyleValue>;
};

// Main atoms object type
export type Atoms = {
  colors: Colors;
  spacing: typeof import("./tokens").spacing;
  borderRadius: typeof import("./tokens").borderRadius;
  radius: RadiusAtoms;
  typography: TypographyAtoms;
  shadows: typeof import("./tokens").shadows;
  touchTargets: typeof import("./tokens").touchTargets;
  animations: typeof import("./tokens").animations;
  iconSizes: IconSizeAtoms;
  layout: LayoutAtoms;
  borders: BorderAtoms;
  backgrounds: PairifiedColors;
  textColors: PairifiedColors;
  spacingAtoms: SpacingAtoms;
  sizes: SizeAtoms;
  flex: FlexAtoms;
  opacity: OpacityAtoms;
  zIndex: ZIndexAtoms;
  overflow: OverflowAtoms;
  textAlign: TextAlignAtoms;
  fontWeight: FontWeightAtoms;
};

// Shorthand aliases types
export type BackgroundAtoms = PairifiedColors;
export type TextColorAtoms = PairifiedColors;
export type MarginAtoms = PairifiedSpacing;
export type PaddingAtoms = PairifiedSpacing;
export type WidthAtoms = PairifiedSpacing;
export type HeightAtoms = PairifiedSpacing;
export type BorderRadiusAllAtoms = PairifiedBorderRadius;
