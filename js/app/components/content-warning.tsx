import { AlertTriangle } from "@tamagui/lucide-icons";
import { Stack, Text, XStack, YStack } from "tamagui";

interface ContentWarningProps {
  warnings: string[];
  size?: "sm" | "md" | "lg";
  variant?: "compact" | "default";
}

// Warning category labels based on IPTC NewsCodes Scheme
const WARNING_LABELS: Record<string, string> = {
  death: "Death",
  drugUse: "Drug Use",
  fantasyViolence: "Fantasy Violence",
  flashingLights: "Flashing Lights",
  language: "Language",
  nudity: "Nudity",
  PII: "Personal Information",
  sexuality: "Sexuality",
  suffering: "Suffering",
  violence: "Violence",
};

export default function ContentWarning({
  warnings,
  size = "md",
  variant = "default",
}: ContentWarningProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  // Size-based styling
  const sizeStyles = {
    sm: {
      iconSize: 12,
      fontSize: 10,
      padding: 4,
      borderRadius: 6,
    },
    md: {
      iconSize: 16,
      fontSize: 12,
      padding: 6,
      borderRadius: 8,
    },
    lg: {
      iconSize: 20,
      fontSize: 14,
      padding: 8,
      borderRadius: 10,
    },
  };

  const currentSize = sizeStyles[size];

  if (variant === "compact") {
    return (
      <Stack
        position="absolute"
        top={currentSize.padding}
        left={currentSize.padding}
        backgroundColor="$yellow9"
        borderRadius={currentSize.borderRadius}
        padding={currentSize.padding}
        borderWidth={1}
        borderColor="$yellow10"
        shadowColor="$yellow9"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.3}
        shadowRadius={4}
      >
        <XStack alignItems="center" gap={4}>
          <AlertTriangle size={currentSize.iconSize} color="$yellow1" />
          <Text
            fontSize={currentSize.fontSize}
            color="$yellow1"
            fontWeight="600"
          >
            {warnings.length}
          </Text>
        </XStack>
      </Stack>
    );
  }

  // Default variant
  return (
    <YStack
      backgroundColor="$yellow9"
      borderRadius={currentSize.borderRadius}
      padding={currentSize.padding}
      borderWidth={1}
      borderColor="$yellow10"
      shadowColor="$yellow9"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.3}
      shadowRadius={4}
      gap={6}
    >
      <XStack alignItems="center" gap={6}>
        <AlertTriangle size={currentSize.iconSize} color="$yellow1" />
        <Text
          fontSize={currentSize.fontSize + 2}
          color="$yellow1"
          fontWeight="600"
        >
          Content Warning
        </Text>
      </XStack>

      <YStack gap={4}>
        {warnings.map((warning, index) => (
          <Text
            key={index}
            fontSize={currentSize.fontSize}
            color="$yellow1"
            fontWeight="500"
          >
            • {WARNING_LABELS[warning] || warning}
          </Text>
        ))}
      </YStack>
    </YStack>
  );
}
