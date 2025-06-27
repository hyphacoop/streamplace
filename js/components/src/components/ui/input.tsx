import { cva, type VariantProps } from "class-variance-authority";
import React, { forwardRef } from "react";
import { Platform, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useTheme } from "../../lib/theme/theme";
import { InputPrimitive, InputPrimitiveProps } from "./primitives/input";

const inputVariants = cva("", {
  variants: {
    variant: {
      default: "default",
      filled: "filled",
      underlined: "underlined",
    },
    size: {
      sm: "sm",
      md: "md",
      lg: "lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export interface InputProps
  extends Omit<InputPrimitiveProps, "style" | "error">,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerStyle?: any;
  inputStyle?: any;
}

export const Input = forwardRef<any, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      label,
      description,
      error,
      required = false,
      leftAddon,
      rightAddon,
      disabled = false,
      containerStyle,
      inputStyle,
      ...props
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<any>(null);

    // Create dynamic styles based on theme
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    // Get variant and size styles
    const containerStyles = React.useMemo(() => {
      const variantStyle = styles[`${variant}Container` as keyof typeof styles];
      const sizeStyle = styles[`${size}Container` as keyof typeof styles];
      const focusStyle = isFocused ? styles.focusedContainer : null;
      return [variantStyle, sizeStyle, focusStyle];
    }, [variant, size, styles, isFocused]);

    const textStyles = React.useMemo(() => {
      const variantTextStyle = styles[`${variant}Input` as keyof typeof styles];
      const sizeTextStyle = styles[`${size}Input` as keyof typeof styles];
      return [variantTextStyle, sizeTextStyle];
    }, [variant, size, styles]);

    const handleFocus = React.useCallback(
      (event: any) => {
        setIsFocused(true);
        if (props.onFocus) {
          props.onFocus(event);
        }
      },
      [props.onFocus],
    );

    const handleBlur = React.useCallback(
      (event: any) => {
        setIsFocused(false);
        if (props.onBlur) {
          props.onBlur(event);
        }
      },
      [props.onBlur],
    );

    const handleContainerPress = React.useCallback(() => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    }, [disabled]);

    const hasAddons = leftAddon || rightAddon;

    if (hasAddons) {
      return (
        <InputPrimitive.Group>
          {label && (
            <InputPrimitive.Label
              required={required}
              disabled={disabled}
              error={!!error}
            >
              {label}
            </InputPrimitive.Label>
          )}

          <TouchableWithoutFeedback onPress={handleContainerPress}>
            <InputPrimitive.Container
              focused={isFocused}
              error={!!error}
              disabled={disabled}
              style={[containerStyles, containerStyle, { padding: 0 }]}
            >
              {leftAddon && (
                <InputPrimitive.Addon position="left">
                  {leftAddon}
                </InputPrimitive.Addon>
              )}

              <InputPrimitive.Root
                ref={(node) => {
                  inputRef.current = node;
                  if (ref) {
                    if (typeof ref === "function") {
                      ref(node);
                    } else {
                      ref.current = node;
                    }
                  }
                }}
                disabled={disabled}
                error={!!error}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={[
                  textStyles,
                  styles.inputInContainer,
                  inputStyle,
                  { outline: "none" },
                ]}
                placeholderTextColor={
                  disabled ? theme.colors.textDisabled : theme.colors.textMuted
                }
                {...props}
              />

              {rightAddon && (
                <InputPrimitive.Addon position="right">
                  {rightAddon}
                </InputPrimitive.Addon>
              )}
            </InputPrimitive.Container>
          </TouchableWithoutFeedback>

          {description && !error && (
            <InputPrimitive.Description disabled={disabled}>
              {description}
            </InputPrimitive.Description>
          )}

          <InputPrimitive.Error visible={!!error}>{error}</InputPrimitive.Error>
        </InputPrimitive.Group>
      );
    }

    return (
      <InputPrimitive.Group>
        {label && (
          <InputPrimitive.Label
            required={required}
            disabled={disabled}
            error={!!error}
          >
            {label}
          </InputPrimitive.Label>
        )}

        <InputPrimitive.Root
          ref={(node) => {
            inputRef.current = node;
            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          disabled={disabled}
          error={!!error}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[containerStyles, textStyles, containerStyle, inputStyle]}
          placeholderTextColor={
            disabled ? theme.colors.textDisabled : theme.colors.textMuted
          }
          {...props}
        />

        {description && !error && (
          <InputPrimitive.Description disabled={disabled}>
            {description}
          </InputPrimitive.Description>
        )}

        <InputPrimitive.Error visible={!!error}>{error}</InputPrimitive.Error>
      </InputPrimitive.Group>
    );
  },
);

Input.displayName = "Input";

// Create theme-aware styles
function createStyles(theme: any) {
  return StyleSheet.create({
    // Variant styles for containers
    defaultContainer: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
    },

    filledContainer: {
      backgroundColor: theme.colors.muted,
      borderWidth: 0,
      borderRadius: theme.borderRadius.md,
    },

    underlinedContainer: {
      backgroundColor: "transparent",
      borderWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      borderRadius: 0,
      paddingHorizontal: 0,
    },

    // Variant styles for inputs
    defaultInput: {
      color: theme.colors.text,
      backgroundColor: "transparent",
    },

    filledInput: {
      color: theme.colors.text,
      backgroundColor: "transparent",
    },

    underlinedInput: {
      color: theme.colors.text,
      backgroundColor: "transparent",
    },

    // Size styles for containers
    smContainer: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      minHeight: theme.touchTargets.minimum - 8,
    },

    mdContainer: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[3],
      minHeight: theme.touchTargets.minimum,
    },

    lgContainer: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[4],
      minHeight: theme.touchTargets.comfortable,
    },

    // Size styles for inputs
    smInput: {
      fontSize: 14,
      lineHeight: 18,
      ...Platform.select({
        ios: {
          paddingVertical: 0,
        },
        android: {
          paddingVertical: 0,
          textAlignVertical: "center",
        },
      }),
    },

    mdInput: {
      fontSize: 16,
      lineHeight: 20,
      ...Platform.select({
        ios: {
          paddingVertical: 0,
        },
        android: {
          paddingVertical: 0,
          textAlignVertical: "center",
        },
      }),
    },

    lgInput: {
      fontSize: 18,
      lineHeight: 22,
      ...Platform.select({
        ios: {
          paddingVertical: 0,
        },
        android: {
          paddingVertical: 0,
          textAlignVertical: "center",
        },
      }),
    },

    // Special style for inputs inside containers
    inputInContainer: {
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderWidth: 0,
      backgroundColor: "transparent",
      minHeight: "auto",
      borderRadius: 0,
    },

    // Focus styles
    focusedContainer: {
      borderColor: theme.colors.primary,
      borderWidth: 1,
    },
  });
}

// Export input variants for external use
export { inputVariants };
