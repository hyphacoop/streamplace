import { AlertTriangle } from "@tamagui/lucide-icons";
import { Paragraph, View, XStack } from "tamagui";

interface ContentWarningsProps {
  warnings: string[];
  compact?: boolean;
}

const WARNING_LABELS: Record<string, string> = {
  death: "Death",
  drugUse: "Drug Use",
  fantasyViolence: "Fantasy Violence",
  flashingLights: "Flashing Lights",
  language: "Language",
  nudity: "Nudity",
  PII: "Personal Information",
  sexuality: "Sexuality",
  suffering: "Suffering/Triggering Content",
  violence: "Violence",
};

export default function ContentWarnings({
  warnings,
  compact = false,
}: ContentWarningsProps) {
  console.log(
    `[ContentWarnings] Rendering with warnings:`,
    warnings,
    `compact:`,
    compact,
  );

  if (!warnings || warnings.length === 0) {
    console.log(`[ContentWarnings] No warnings to display, returning null`);
    return null;
  }

  return (
    <View
      backgroundColor="$orange4"
      borderColor="$orange8"
      borderWidth={1}
      borderRadius="$2"
      padding={compact ? "$1.5" : "$2"}
      marginVertical="$1"
      width="fit-content"
    >
      <XStack alignItems="center" gap="$2">
        <AlertTriangle size={compact ? 14 : 16} color="$orange11" />
        <View flex={1}>
          <Paragraph
            fontSize={compact ? "$1" : "$2"}
            color="$orange12"
            fontWeight="500"
            flexWrap="wrap"
          >
            Content Warning:{" "}
            {warnings
              .map((warning) => {
                // Handle both formats: "flashingLights" and "place.stream.metadata.configuration#flashingLights"
                const cleanWarning = warning.includes("#")
                  ? warning.split("#")[1]
                  : warning;
                return WARNING_LABELS[cleanWarning] || cleanWarning;
              })
              .join(", ")}
          </Paragraph>
        </View>
      </XStack>
    </View>
  );
}
