import { Info } from "@tamagui/lucide-icons";
import { Paragraph, View, XStack } from "tamagui";

interface ContentRightsProps {
  contentRights: {
    creator?: string;
    copyrightNotice?: string;
    copyrightYear?: string | number;
    license?: string;
    creditLine?: string;
  };
  compact?: boolean;
}

const LICENSE_LABELS: Record<string, string> = {
  cc0_1__0: "CC0 - Public Domain 1.0",
  "cc-by_4__0": "CC BY - Attribution 4.0",
  "cc-by-sa_4__0": "CC BY-SA - Attribution ShareAlike 4.0",
  "cc-by-nc_4__0": "CC BY-NC - Attribution NonCommercial 4.0",
  "cc-by-nc-sa_4__0": "CC BY-NC-SA - Attribution NonCommercial ShareAlike 4.0",
  "cc-by-nd_4__0": "CC BY-ND - Attribution NoDerivatives 4.0",
  "cc-by-nc-nd_4__0":
    "CC BY-NC-ND - Attribution NonCommercial NoDerivatives 4.0",
  "all-rights-reserved": "All Rights Reserved",
  proprietary: "Proprietary License",
};

export default function ContentRights({
  contentRights,
  compact = false,
}: ContentRightsProps) {
  console.log(
    `[ContentRights] Rendering with rights:`,
    contentRights,
    `compact:`,
    compact,
  );

  if (!contentRights || Object.keys(contentRights).length === 0) {
    console.log(`[ContentRights] No content rights to display, returning null`);
    return null;
  }

  const rightsParts: string[] = [];

  // Handle creator
  if (contentRights.creator) {
    rightsParts.push(`Creator: ${contentRights.creator}`);
  }

  // Handle copyright year
  if (contentRights.copyrightYear) {
    rightsParts.push(`© ${contentRights.copyrightYear}`);
  }

  // Handle license
  if (contentRights.license) {
    // Handle both formats: "cc0_1__0" and "place.stream.default.metadata#cc0_1__0"
    const cleanLicense = contentRights.license.includes("#")
      ? contentRights.license.split("#")[1]
      : contentRights.license;
    const licenseLabel = LICENSE_LABELS[cleanLicense] || cleanLicense;
    rightsParts.push(`License: ${licenseLabel}`);
  }

  // Handle copyright notice
  if (contentRights.copyrightNotice) {
    rightsParts.push(contentRights.copyrightNotice);
  }

  // Handle credit line
  if (contentRights.creditLine) {
    rightsParts.push(`Credit: ${contentRights.creditLine}`);
  }

  if (rightsParts.length === 0) {
    console.log(
      `[ContentRights] No displayable rights information, returning null`,
    );
    return null;
  }

  return (
    <View
      backgroundColor="$blue4"
      borderColor="$blue8"
      borderWidth={1}
      borderRadius="$2"
      padding={compact ? "$1.5" : "$2"}
      marginVertical="$1"
      width="auto"
    >
      <XStack alignItems="center" gap="$2">
        <Info size={compact ? 14 : 16} color="$blue11" />
        <View flex={1}>
          <Paragraph
            fontSize={compact ? "$1" : "$2"}
            color="$blue12"
            fontWeight="500"
            flexWrap="wrap"
          >
            Content Rights: {rightsParts.join(" • ")}
          </Paragraph>
        </View>
      </XStack>
    </View>
  );
}
