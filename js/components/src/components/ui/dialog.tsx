import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react-native";
import React, { forwardRef } from "react";
import { Platform, Text } from "react-native";
import { useTheme } from "../../lib/theme/theme";
import * as zero from "../../ui";
import { createThemedIcon } from "./icons";
import { ModalPrimitive, ModalPrimitiveProps } from "./primitives/modal";

const ThemedX = createThemedIcon(X);

// Dialog variants using class-variance-authority pattern
const dialogVariants = cva("", {
  variants: {
    variant: {
      default: "default",
      sheet: "sheet",
      fullscreen: "fullscreen",
    },
    size: {
      sm: "sm",
      md: "md",
      lg: "lg",
      xl: "xl",
      full: "full",
    },
    position: {
      center: "center",
      top: "top",
      bottom: "bottom",
      left: "left",
      right: "right",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    position: "center",
  },
});

export interface DialogProps
  extends Omit<ModalPrimitiveProps, "children">,
    VariantProps<typeof dialogVariants> {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  dismissible?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const Dialog = forwardRef<any, DialogProps>(
  (
    {
      variant = "left",
      size = "md",
      position = "center",
      children,
      title,
      description,
      dismissible = true,
      showCloseButton = true,
      onClose,
      open = false,
      onOpenChange,
      ...props
    },
    ref,
  ) => {
    const { zero: zt, theme } = useTheme();

    // Content styles using theme.zero
    const contentStyles = React.useMemo(() => {
      const baseStyle = [
        zt.bg.card,
        zero.r.lg,
        zero.shadows.lg,
        { maxHeight: "90%", maxWidth: "90%" },
      ];

      const variantStyle = (() => {
        switch (variant) {
          case "sheet":
            return [
              { borderRadius: zero.borderRadius.xl },
              {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                marginTop: "auto",
                marginBottom: 0,
                maxHeight: "80%",
                width: "100%",
                maxWidth: "100%",
              },
            ];
          case "fullscreen":
            return [
              {
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: 0,
                margin: 0,
              },
            ];
          default:
            return [];
        }
      })();

      const sizeStyle = (() => {
        switch (size) {
          case "sm":
            return { minWidth: 300, minHeight: 200 };
          case "lg":
            return { minWidth: 500, minHeight: 400 };
          case "xl":
            return { minWidth: 600, minHeight: 500 };
          case "full":
            return {
              width: "95%",
              height: "95%",
              maxWidth: "95%",
              maxHeight: "95%",
            };
          default:
            return { minWidth: 400, minHeight: 300 };
        }
      })();

      return [baseStyle, variantStyle, sizeStyle].flat();
    }, [variant, size, zero]);

    const handleClose = React.useCallback(() => {
      if (onClose) {
        onClose();
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    }, [onClose, onOpenChange]);

    const presentationStyle = React.useMemo(() => {
      if (variant === "sheet" && Platform.OS === "ios") {
        return "pageSheet" as const;
      }
      if (variant === "fullscreen") {
        return "fullScreen" as const;
      }
      return Platform.OS === "ios"
        ? ("pageSheet" as const)
        : ("fullScreen" as const);
    }, [variant]);

    const animationType = React.useMemo(() => {
      if (variant === "sheet") {
        return "slide" as const;
      }
      return "fade" as const;
    }, [variant]);

    return (
      <ModalPrimitive.Root
        ref={ref}
        open={open}
        onOpenChange={onOpenChange}
        presentationStyle={presentationStyle}
        animationType={animationType}
        {...props}
      >
        <ModalPrimitive.Overlay
          dismissible={dismissible}
          onDismiss={handleClose}
          style={zt.bg.overlay}
        >
          <ModalPrimitive.Content
            position={position || "left"}
            size={size || "md"}
            style={contentStyles}
          >
            {(title || showCloseButton) && (
              <ModalPrimitive.Header
                withBorder={variant !== "sheet"}
                style={[
                  zero.p[4],
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
              >
                <DialogTitle>{title}</DialogTitle>
                {showCloseButton && (
                  <ModalPrimitive.Close
                    onClose={handleClose}
                    style={[
                      zero.p[2],
                      {
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <DialogCloseIcon />
                  </ModalPrimitive.Close>
                )}
              </ModalPrimitive.Header>
            )}

            <ModalPrimitive.Body
              scrollable={variant !== "fullscreen"}
              style={[zero.p[6], { paddingTop: 0, flex: 1 }]}
            >
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
              {children}
            </ModalPrimitive.Body>
          </ModalPrimitive.Content>
        </ModalPrimitive.Overlay>
      </ModalPrimitive.Root>
    );
  },
);

Dialog.displayName = "Dialog";

// Dialog Title component
export interface DialogTitleProps {
  children?: React.ReactNode;
  style?: any;
}

export const DialogTitle = forwardRef<any, DialogTitleProps>(
  ({ children, style, ...props }, ref) => {
    const { zero: zt } = useTheme();

    if (!children) return null;

    return (
      <Text
        ref={ref}
        style={[zt.text.xl, { fontWeight: "600", flex: 1 }, style]}
        {...props}
      >
        {children}
      </Text>
    );
  },
);

DialogTitle.displayName = "DialogTitle";

// Dialog Description component
export interface DialogDescriptionProps {
  children?: React.ReactNode;
  style?: any;
}

export const DialogDescription = forwardRef<any, DialogDescriptionProps>(
  ({ children, style, ...props }, ref) => {
    const { zero: zt } = useTheme();

    if (!children) return null;

    return (
      <Text ref={ref} style={[zt.text.muted, zero.mb[4], style]} {...props}>
        {children}
      </Text>
    );
  },
);

DialogDescription.displayName = "DialogDescription";

// Dialog Footer component
export interface DialogFooterProps {
  children?: React.ReactNode;
  direction?: "row" | "column";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";
  withBorder?: boolean;
  style?: any;
}

export const DialogFooter = forwardRef<any, DialogFooterProps>(
  (
    {
      children,
      direction = "row",
      justify = "flex-end",
      withBorder = true,
      style,
      ...props
    },
    ref,
  ) => {
    const { zero: zt } = useTheme();

    if (!children) return null;

    return (
      <ModalPrimitive.Footer
        ref={ref}
        withBorder={withBorder}
        direction={direction}
        justify={justify}
        style={[zero.p[6], { gap: 8 }, style]}
        {...props}
      >
        {children}
      </ModalPrimitive.Footer>
    );
  },
);

DialogFooter.displayName = "DialogFooter";

// Dialog Close Icon component (Lucide X)
const DialogCloseIcon = () => {
  return <ThemedX size="md" variant="default" />;
};

// Export dialog variants for external use
export { dialogVariants };
