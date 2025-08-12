import { ChevronDown, Info } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { createStreamKeyRecord, selectStoredKey } from "features/bluesky/blueskySlice";
import { createContentMetadata, selectCurrentMetadataRkey, selectError, selectIsCreating, selectIsUpdating, updateContentMetadata } from "features/bluesky/contentMetadataSlice";
import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  Adapt,
  Button,
  Checkbox,
  Input,
  Label,
  Paragraph,
  RadioGroup,
  Select,
  Sheet,
  TextArea,
  View,
  XStack,
  YStack,
  isWeb
} from "tamagui";

// Type definitions for metadata
export interface DistributionPolicy {
  allowBroadcast: boolean;
  allowArchive: boolean;
  broadcastUntil: string;
  customDuration?: string;
  customDate?: string;
  customTime?: string;
}

export interface Rights {
  copyright?: string;
  copyrightYear?: string;
  attribution?: string;
  license?: string;
  customLicense?: string;
}

export interface ContentMetadata {
  contentWarnings: string[];
  distributionPolicy: DistributionPolicy;
  contentRights: Rights;
}

interface ContentMetadataFormProps {
  onMetadataChange: (metadata: ContentMetadata) => void;
  initialMetadata?: Partial<ContentMetadata>;
  showUpdateButton?: boolean;
}

// Content warnings list based on IPTC NewsCodes Scheme
// https://cv.iptc.org/newscodes/contentwarning/
const CONTENT_WARNINGS = [
  { value: "death", label: "Death" },
  { value: "drugUse", label: "Drug Use" },
  { value: "fantasyViolence", label: "Fantasy Violence" },
  { value: "flashingLights", label: "Flashing Lights" },
  { value: "language", label: "Language" },
  { value: "nudity", label: "Nudity" },
  { value: "PII", label: "Personally Identifiable Information" },
  { value: "sexuality", label: "Sexuality" },
  { value: "suffering", label: "Upsetting or Disturbing" },
  { value: "violence", label: "Violence" },
];

const BROADCAST_OPTIONS = [
  { value: "forever", label: "Forever" },
  { value: "1year", label: "1 Year" },
  { value: "1month", label: "1 Month" },
  { value: "1day", label: "1 Day" },
  { value: "custom", label: "Custom" },
];

const LICENSE_OPTIONS = [
  { value: "all-rights-reserved", label: "All Rights Reserved" },
  { value: "cc0", label: "CC0 (Public Domain)" },
  { value: "cc-by", label: "CC BY" },
  { value: "cc-by-sa", label: "CC BY-SA" },
  { value: "cc-by-nc", label: "CC BY-NC" },
  { value: "cc-by-nc-sa", label: "CC BY-NC-SA" },
  { value: "cc-by-nd", label: "CC BY-ND" },
  { value: "cc-by-nc-nd", label: "CC BY-NC-ND" },
  { value: "custom", label: "Custom License" },
];

const LICENSE_DESCRIPTIONS: Record<string, string> = {
  "all-rights-reserved": "All rights reserved to the creator — others cannot use, modify, or share without explicit authorization.",
  "cc0": "Public domain dedication. You waive all copyright and related rights where possible. Others may copy, modify, distribute, or perform your work for any purpose without attribution.",
  "cc-by": "Attribution required. Others may copy, distribute, remix, and build upon your work, even commercially, if they credit you.",
  "cc-by-sa": "Attribution + share-alike. Others may adapt and build upon your work, even commercially, if they credit you and license their new creations under identical terms.",
  "cc-by-nc": "Attribution + non-commercial. Others may adapt and build upon your work for non-commercial purposes only, and must credit you.",
  "cc-by-nc-sa": "Attribution + non-commercial + share-alike. Others may adapt and build upon your work for non-commercial purposes only, must credit you, and must license their new creations under identical terms.",
  "cc-by-nd": "Attribution + no derivatives. Others may reuse your work, even commercially, but it must remain unchanged and you must be credited.",
  "cc-by-nc-nd": "Attribution + non-commercial + no derivatives. Others may download and share your work with credit, but cannot change it or use it commercially.",
  "custom": "Custom license. Define your own terms for how others can use, adapt, or share your content."
};


// Helper to generate custom date options
const generateDateOptions = () => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  
  return { months, years, days, hours, minutes };
};

export default function ContentMetadataForm({
  onMetadataChange,
  initialMetadata,
  showUpdateButton = false,
}: ContentMetadataFormProps) {
  const { width } = useWindowDimensions();
  const isWide = width > 1020;
  const useTwoColumns = isWide;
  const dispatch = useAppDispatch();
  const toast = useToastController();
  const isUpdating = useAppSelector(selectIsUpdating);
  const isCreating = useAppSelector(selectIsCreating);
  const error = useAppSelector(selectError);
  const currentMetadataRkey = useAppSelector(selectCurrentMetadataRkey);
  const storedKey = useAppSelector(selectStoredKey);
  
  const isLoading = isUpdating || isCreating;
  const hasMetadata = Boolean(currentMetadataRkey);
  const hasStreamKey = Boolean(storedKey);

  const [contentWarnings, setContentWarnings] = useState<string[]>(
    initialMetadata?.contentWarnings || []
  );
  const [distributionPolicy, setDistributionPolicy] = useState<DistributionPolicy>(
    initialMetadata?.distributionPolicy || {
      allowBroadcast: true,
      allowArchive: true,
      broadcastUntil: "forever",
    }
  );
  const [contentRights, setContentRights] = useState<Rights>(
    initialMetadata?.contentRights || {
      license: "all-rights-reserved"
    }
  );
  const [selectedLicense, setSelectedLicense] = useState(
    initialMetadata?.contentRights?.license || "all-rights-reserved"
  );

  // Date picker state
  const [customDay, setCustomDay] = useState("1");
  const [customMonth, setCustomMonth] = useState("January");
  const [customYear, setCustomYear] = useState(String(new Date().getFullYear() + 1));
  const [customHour, setCustomHour] = useState("12");
  const [customMinute, setCustomMinute] = useState("00");
  const [customPeriod, setCustomPeriod] = useState<"AM" | "PM">("PM");

  const { months, years, days, hours, minutes } = generateDateOptions();

  const handleContentWarningChange = (warning: string, checked: boolean) => {
    const newWarnings = checked 
      ? [...contentWarnings, warning]
      : contentWarnings.filter((w) => w !== warning);
    setContentWarnings(newWarnings);
    updateMetadata({ contentWarnings: newWarnings });
  };

  const handleDistributionPolicyChange = (updates: Partial<DistributionPolicy>) => {
    const newPolicy = { ...distributionPolicy, ...updates };
    setDistributionPolicy(newPolicy);
    updateMetadata({ distributionPolicy: newPolicy });
  };

  const handleContentRightsChange = (updates: Partial<Rights>) => {
    const newRights = { ...contentRights, ...updates };
    setContentRights(newRights);
    updateMetadata({ contentRights: newRights });
  };

  const updateMetadata = (updates: Partial<ContentMetadata>) => {
    const metadata: ContentMetadata = {
      contentWarnings: updates.contentWarnings || contentWarnings,
      distributionPolicy: updates.distributionPolicy || distributionPolicy,
      contentRights: updates.contentRights || contentRights,
    };
    onMetadataChange(metadata);
  };

  // Update custom date/time when values change
  React.useEffect(() => {
    if (distributionPolicy.broadcastUntil === "custom") {
      const monthIndex = months.indexOf(customMonth);
      // Handle 12-hour format correctly
      let hour24 = parseInt(customHour);
      if (customPeriod === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (customPeriod === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      
      const date = new Date(
        parseInt(customYear),
        monthIndex,
        parseInt(customDay),
        hour24,
        parseInt(customMinute)
      );
      const isoString = date.toISOString();
      handleDistributionPolicyChange({ 
        customDuration: isoString,
        customDate: `${customMonth} ${customDay}, ${customYear}`,
        customTime: `${customHour}:${customMinute} ${customPeriod}`
      });
    }
  }, [customDay, customMonth, customYear, customHour, customMinute, customPeriod, distributionPolicy.broadcastUntil]);

  const handleSaveMetadata = async () => {
    try {
      // First ensure we have a stream key
      if (!hasStreamKey) {
        await dispatch(createStreamKeyRecord({ store: true })).unwrap();
      }

      const metadataPayload = {
        contentWarnings,
        distributionPolicy: {
          allowBroadcast: distributionPolicy.allowBroadcast,
          allowArchive: distributionPolicy.allowArchive,
          broadcastUntil: distributionPolicy.broadcastUntil,
          customDuration: distributionPolicy.customDuration,
        },
        rights: {
          copyright: contentRights.copyright,
          copyrightYear: contentRights.copyrightYear,
          attribution: contentRights.attribution,
          license: contentRights.license,
          customLicense: contentRights.customLicense,
        },
      };

      if (hasMetadata && currentMetadataRkey) {
        // Update existing metadata
        await dispatch(updateContentMetadata({
          rkey: currentMetadataRkey,
          ...metadataPayload,
        })).unwrap();
        toast.show("Success", { message: "Content metadata updated successfully" });
      } else {
        // Create new metadata
        await dispatch((createContentMetadata as any)({
          contentWarnings,
          distributionPolicy,
          rights: contentRights,
        })).unwrap();
        toast.show("Success", { message: "Content metadata created successfully" });
      }
    } catch (error) {
      toast.show("Error", { 
        message: `Failed to ${hasMetadata ? 'update' : 'create'} metadata: ${error.message || error}` 
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Two-column layout */}
      <View
        flexDirection={useTwoColumns ? "row" : "column"}
        gap="$1"
        paddingHorizontal={isWide ? "$1" : "$1"}
        paddingVertical="$0.5"
        justifyContent="center"
        alignItems={useTwoColumns ? "flex-start" : "center"}
      >
        {/* Left column: Content Warnings and Distribution Policy */}
        <View
          f={1}
          minWidth={0}
          gap="$1.5"
          alignItems="center"
          justifyContent="flex-start"
          w={useTwoColumns ? 400 : "100%"}
          style={{
            marginTop: 2,
            ...(useTwoColumns ? {} : { marginLeft: 5 }),
          }}
        >
          {/* Content Warnings Section */}
          <YStack gap="$0.5" w="100%">
            <XStack alignItems="baseline" gap="$1">
              <Paragraph fontWeight="600" fontSize="$2.5">
                Content Warnings
              </Paragraph>
              <Paragraph color="$gray11" fontSize="$1">
                (select any that apply)
              </Paragraph>
            </XStack>
            
            {/* Ultra-compact grid layout for content warnings */}
            <View 
              flexDirection="row" 
              flexWrap="wrap"
              gap={2}
              w="100%"
            >
              {CONTENT_WARNINGS.map((warning) => {
                const isChecked = contentWarnings.includes(warning.value);
                return (
                  <View
                    key={warning.value}
                    width="49.5%"
                    minHeight={20}
                  >
                    <XStack 
                      alignItems="center" 
                      gap="$1"
                      paddingVertical={2}
                      paddingHorizontal={4}
                      backgroundColor={isChecked ? "$gray3" : "transparent"}
                      borderRadius="$1"
                      cursor="pointer"
                      hoverStyle={{ backgroundColor: "$gray3" }}
                      pressStyle={{ backgroundColor: "$gray4" }}
                      onPress={() => {
                        handleContentWarningChange(warning.value, !isChecked);
                      }}
                    >
                      <Checkbox
                        id={`warning-${warning.value}`}
                        checked={isChecked}
                        size="$2"
                        borderWidth={1.5}
                        borderColor={isChecked ? "$blue10" : "$gray8"}
                        backgroundColor={isChecked ? "$blue3" : "transparent"}
                        pointerEvents="none"
                        disabled
                      >
                        <Checkbox.Indicator>
                          <View 
                            backgroundColor="$blue10"
                            width={6}
                            height={6}
                            borderRadius="$0.5"
                          />
                        </Checkbox.Indicator>
                      </Checkbox>
                      <Label 
                        fontSize="$1"
                        cursor="pointer"
                        flex={1}
                        userSelect="none"
                        pointerEvents="none"
                      >
                        {warning.label}
                      </Label>
                    </XStack>
                  </View>
                );
              })}
            </View>
          </YStack>

          {/* Distribution Policy Section */}
          <YStack gap="$0.5" w="100%">
            <XStack alignItems="baseline" gap="$1">
              <Paragraph fontWeight="600" fontSize="$2.5">
                Distribution
              </Paragraph>
              <Paragraph color="$gray11" fontSize="$1">
                (broadcast & archive)
              </Paragraph>
            </XStack>
            
            <YStack gap="$1">
              <Label fontSize="$1.5" fontWeight="500">Broadcast Duration</Label>
              <RadioGroup
                value={distributionPolicy.broadcastUntil}
                onValueChange={(value) =>
                  handleDistributionPolicyChange({
                    broadcastUntil: value as DistributionPolicy["broadcastUntil"],
                  })
                }
              >
                <XStack flexWrap="wrap" gap={4}>
                  {BROADCAST_OPTIONS.map((option) => {
                    const isSelected = distributionPolicy.broadcastUntil === option.value;
                    return (
                      <Label 
                        key={option.value}
                        htmlFor={`broadcast-${option.value}`}
                        cursor="pointer"
                        userSelect="none"
                      >
                        <XStack 
                          alignItems="center" 
                          gap="$1" 
                          paddingVertical={2}
                          paddingHorizontal={6}
                          backgroundColor={isSelected ? "$gray3" : "transparent"}
                          borderRadius="$1"
                          cursor="pointer"
                          hoverStyle={{ backgroundColor: "$gray3" }}
                          pressStyle={{ backgroundColor: "$gray4" }}
                        >
                          <RadioGroup.Item 
                            value={option.value} 
                            id={`broadcast-${option.value}`}
                            size="$2"
                            borderWidth={1.5}
                            borderColor={isSelected ? "$blue10" : "$gray8"}
                          >
                            <RadioGroup.Indicator>
                              <View 
                                backgroundColor="$blue10"
                                width={6}
                                height={6}
                                borderRadius="$10"
                              />
                            </RadioGroup.Indicator>
                          </RadioGroup.Item>
                          <Paragraph 
                            fontSize="$1"
                            cursor="pointer"
                            userSelect="none"
                          >
                            {option.label}
                          </Paragraph>
                        </XStack>
                      </Label>
                    );
                  })}
                </XStack>
              </RadioGroup>
              
              {distributionPolicy.broadcastUntil === "custom" && (
                <YStack gap="$1" mt="$1" p="$1" backgroundColor="$gray2" borderRadius="$2">
                  <Label fontSize="$1" fontWeight="500">Select End Date & Time</Label>
                  
                  {/* Date Selection */}
                  <XStack gap="$1" alignItems="center">
                    <Select
                      value={customMonth}
                      onValueChange={setCustomMonth}
                      size="$1"
                    >
                      <Select.Trigger width={90} size="$2">
                        <Select.Value placeholder="Month" fontSize="$1" />
                      </Select.Trigger>
                      <Select.Content zIndex={200000}>
                        <Select.Viewport>
                          <Select.Group>
                            {months.map((month) => (
                              <Select.Item key={month} value={month} index={months.indexOf(month)}>
                                <Select.ItemText fontSize="$1">{month}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select>
                    
                    <Select
                      value={customDay}
                      onValueChange={setCustomDay}
                      size="$1"
                    >
                      <Select.Trigger width={50} size="$2">
                        <Select.Value placeholder="Day" fontSize="$1" />
                      </Select.Trigger>
                      <Select.Content zIndex={200000}>
                        <Select.Viewport>
                          <Select.Group>
                            {days.map((day) => (
                              <Select.Item key={day} value={String(day)} index={day - 1}>
                                <Select.ItemText fontSize="$1">{day}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select>
                    
                    <Select
                      value={customYear}
                      onValueChange={setCustomYear}
                      size="$1"
                    >
                      <Select.Trigger width={65} size="$2">
                        <Select.Value placeholder="Year" fontSize="$1" />
                      </Select.Trigger>
                      <Select.Content zIndex={200000}>
                        <Select.Viewport>
                          <Select.Group>
                            {years.map((year) => (
                              <Select.Item key={year} value={String(year)} index={years.indexOf(year)}>
                                <Select.ItemText fontSize="$1">{year}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select>
                  </XStack>
                  
                  {/* Time Selection */}
                  <XStack gap="$1" alignItems="center">
                    <Select
                      value={customHour}
                      onValueChange={setCustomHour}
                      size="$1"
                    >
                      <Select.Trigger width={50} size="$2">
                        <Select.Value placeholder="HH" fontSize="$1" />
                      </Select.Trigger>
                      <Select.Content zIndex={200000}>
                        <Select.Viewport>
                          <Select.Group>
                            {hours.map((hour) => (
                              <Select.Item key={hour} value={String(hour)} index={hour - 1}>
                                <Select.ItemText fontSize="$1">{hour}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select>
                    
                    <Paragraph fontSize="$1">:</Paragraph>
                    
                    <Select
                      value={customMinute}
                      onValueChange={setCustomMinute}
                      size="$1"
                    >
                      <Select.Trigger width={50} size="$2">
                        <Select.Value placeholder="MM" fontSize="$1" />
                      </Select.Trigger>
                      <Select.Content zIndex={200000}>
                        <Select.Viewport>
                          <Select.Group>
                            {minutes.map((minute) => (
                              <Select.Item key={minute} value={minute} index={minutes.indexOf(minute)}>
                                <Select.ItemText fontSize="$1">{minute}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select>
                    
                    <XStack gap="$0.5">
                      {["AM", "PM"].map((period) => {
                        const isSelected = customPeriod === period;
                        return (
                          <XStack
                            key={period}
                            alignItems="center"
                            gap="$0.5"
                            paddingHorizontal={6}
                            paddingVertical={2}
                            backgroundColor={isSelected ? "$blue10" : "$gray3"}
                            borderRadius="$1"
                            cursor="pointer"
                            hoverStyle={{ backgroundColor: isSelected ? "$blue11" : "$gray4" }}
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => setCustomPeriod(period as "AM" | "PM")}
                          >
                            <Paragraph 
                              fontSize="$1" 
                              fontWeight={isSelected ? "600" : "400"}
                              color={isSelected ? "white" : "$gray11"}
                              cursor="pointer"
                            >
                              {period}
                            </Paragraph>
                          </XStack>
                        );
                      })}
                    </XStack>
                  </XStack>
                  
                  {distributionPolicy.customDate && (
                    <Paragraph fontSize="$1" color="$gray11" mt="$0.5">
                      Until: {distributionPolicy.customDate} at {distributionPolicy.customTime}
                    </Paragraph>
                  )}
                </YStack>
              )}
            </YStack>

            <YStack gap="$0.5">
              <XStack 
                alignItems="center" 
                gap="$1"
                paddingVertical={2}
                paddingHorizontal={4}
                backgroundColor={distributionPolicy.allowArchive ? "$gray3" : "transparent"}
                borderRadius="$1"
                cursor="pointer"
                hoverStyle={{ backgroundColor: "$gray3" }}
                pressStyle={{ backgroundColor: "$gray4" }}
                onPress={() => {
                  handleDistributionPolicyChange({ 
                    allowArchive: !distributionPolicy.allowArchive 
                  });
                }}
              >
                <Checkbox
                  id="allow-archive"
                  checked={distributionPolicy.allowArchive}
                  size="$2"
                  borderWidth={1.5}
                  borderColor={distributionPolicy.allowArchive ? "$blue10" : "$gray8"}
                  backgroundColor={distributionPolicy.allowArchive ? "$blue3" : "transparent"}
                  pointerEvents="none"
                  disabled
                >
                  <Checkbox.Indicator>
                    <View 
                      backgroundColor="$blue10"
                      width={6}
                      height={6}
                      borderRadius="$0.5"
                    />
                  </Checkbox.Indicator>
                </Checkbox>
                <Label 
                  fontSize="$1"
                  cursor="pointer"
                  userSelect="none"
                  pointerEvents="none"
                >
                  Allow viewers to save this stream
                </Label>
              </XStack>
            </YStack>
          </YStack>
        </View>

        {/* Right column: Content Rights */}
        <View
          f={1}
          minWidth={0}
          gap="$1.5"
          alignItems="center"
          justifyContent="flex-start"
          w={useTwoColumns ? 400 : "100%"}
          style={{
            marginTop: 2,
            ...(useTwoColumns ? {} : { marginLeft: 5 }),
          }}
        >
          <YStack gap="$1.5" w="100%">
            {/* Content Rights Section */}
            <YStack gap="$0.5" w="100%">
              <XStack alignItems="baseline" gap="$1">
                <Paragraph fontWeight="600" fontSize="$2.5">
                  Content Rights
                </Paragraph>
                <Paragraph color="$gray11" fontSize="$1">
                  (copyright & attribution)
                </Paragraph>
              </XStack>
              
              <YStack gap="$1.5">
                <YStack gap="$0.5">
                  <Label fontSize="$1.5" fontWeight="500">License</Label>
                  <Select
                    value={selectedLicense}
                    onValueChange={(value) => {
                      setSelectedLicense(value);
                      if (value !== "custom") {
                        handleContentRightsChange({ license: value });
                      }
                    }}
                  >
                    <Select.Trigger width="100%" iconAfter={ChevronDown} size="$2">
                      <Select.Value placeholder="Select a license" />
                    </Select.Trigger>

                    <Adapt when="sm" platform="touch">
                      <Sheet
                        modal
                        dismissOnSnapToBottom
                        animationConfig={{
                          type: "spring",
                          damping: 20,
                          mass: 1.2,
                          stiffness: 250,
                        }}
                      >
                        <Sheet.Frame>
                          <Sheet.ScrollView>
                            <Adapt.Contents />
                          </Sheet.ScrollView>
                        </Sheet.Frame>
                        <Sheet.Overlay />
                      </Sheet>
                    </Adapt>

                    <Select.Content zIndex={200000}>
                      <Select.ScrollUpButton alignItems="center" justifyContent="center" position="relative" width="100%" height="$3">
                        <YStack zIndex={10}>
                          <ChevronDown size={20} />
                        </YStack>
                      </Select.ScrollUpButton>

                      <Select.Viewport minWidth={200}>
                        <Select.Group>
                          <Select.Label>Choose License</Select.Label>
                          {LICENSE_OPTIONS.map((license) => (
                            <Select.Item
                              key={license.value}
                              index={LICENSE_OPTIONS.indexOf(license)}
                              value={license.value}
                            >
                              <Select.ItemText>{license.label}</Select.ItemText>
                              <Select.ItemIndicator marginLeft="auto">
                                <View
                                  width={5}
                                  height={5}
                                  borderRadius="$10"
                                  backgroundColor="$blue10"
                                />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Group>
                      </Select.Viewport>

                      <Select.ScrollDownButton alignItems="center" justifyContent="center" position="relative" width="100%" height="$3">
                        <YStack zIndex={10}>
                          <ChevronDown size={20} />
                        </YStack>
                      </Select.ScrollDownButton>
                    </Select.Content>
                  </Select>
                  
                  {/* License Description */}
                  {selectedLicense && LICENSE_DESCRIPTIONS[selectedLicense] && (
                    <XStack 
                      gap="$1" 
                      p="$1" 
                      backgroundColor="$gray2" 
                      borderRadius="$1"
                      alignItems="flex-start"
                    >
                      <Info size={12} color="$gray11" mt={2} />
                      <Paragraph fontSize="$1" color="$gray11" flex={1}>
                        {LICENSE_DESCRIPTIONS[selectedLicense]}
                      </Paragraph>
                    </XStack>
                  )}
                </YStack>

                {selectedLicense === "custom" && (
                  <YStack gap="$0.5">
                    <Label fontSize="$1" fontWeight="500">Custom License</Label>
                    <TextArea
                      placeholder="Enter custom license terms"
                      value={contentRights.customLicense || ""}
                      onChangeText={(text) =>
                        handleContentRightsChange({ 
                          license: "custom",
                          customLicense: text 
                        })
                      }
                      size="$2"
                      minHeight={35}
                      fontSize="$1"
                      maxLength={200}
                      borderWidth={1}
                      borderColor="$gray8"
                      backgroundColor="$gray2"
                      focusStyle={{
                        borderColor: "$blue10",
                        backgroundColor: "$gray3"
                      }}
                    />
                  </YStack>
                )}

                <XStack gap="$1.5">
                  <YStack gap="$0.5" f={1}>
                    <Label fontSize="$1" fontWeight="500">Year</Label>
                    <Input
                      placeholder="2025"
                      value={contentRights.copyrightYear || ""}
                      onChangeText={(text) =>
                        handleContentRightsChange({ copyrightYear: text })
                      }
                      size="$2"
                      fontSize="$1"
                      maxLength={4}
                      borderWidth={1}
                      borderColor="$gray8"
                      backgroundColor="$gray2"
                      focusStyle={{
                        borderColor: "$blue10",
                        backgroundColor: "$gray3"
                      }}
                    />
                  </YStack>
                  
                  <YStack gap="$0.5" f={2}>
                    <Label fontSize="$1" fontWeight="500">Attribution</Label>
                    <Input
                      placeholder="Your Name / Handle"
                      value={contentRights.attribution || ""}
                      onChangeText={(text) =>
                        handleContentRightsChange({ attribution: text })
                      }
                      size="$2"
                      fontSize="$1"
                      maxLength={100}
                      borderWidth={1}
                      borderColor="$gray8"
                      backgroundColor="$gray2"
                      focusStyle={{
                        borderColor: "$blue10",
                        backgroundColor: "$gray3"
                      }}
                    />
                  </YStack>
                </XStack>

                <YStack gap="$0.5">
                  <Label fontSize="$1" fontWeight="500">Copyright Notice (Optional)</Label>
                  <TextArea
                    placeholder="Additional copyright info"
                    value={contentRights.copyright || ""}
                    onChangeText={(text) =>
                      handleContentRightsChange({ copyright: text })
                    }
                    size="$2"
                    fontSize="$1"
                    minHeight={30}
                    maxLength={200}
                    borderWidth={1}
                    borderColor="$gray8"
                    backgroundColor="$gray2"
                    focusStyle={{
                      borderColor: "$blue10",
                      backgroundColor: "$gray3"
                    }}
                  />
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        </View>
      </View>

      {/* Save/Update Button */}
      {showUpdateButton && (
        <View p="$2" alignItems="center">
          <Button
            disabled={isLoading}
            opacity={isLoading ? 0.5 : 1}
            size="$4"
            w="100%"
            maxWidth={400}
            onPress={handleSaveMetadata}
          >
            {isLoading 
              ? (isCreating ? "Creating..." : "Updating...") 
              : (hasMetadata ? "Update Content Metadata" : "Create Content Metadata")
            }
          </Button>
          {error && (
            <Paragraph color="$red10" fontSize="$1" mt="$1">
              {error}
            </Paragraph>
          )}
        </View>
      )}

      {/* Footer Information */}
      <View p="$0.5" maxWidth={900} alignSelf="center">
        <XStack gap="$1" backgroundColor="$gray2" p="$1" borderRadius="$1" alignItems="center">
          <Paragraph fontSize="$1" color="$gray11" flex={1}>
            Metadata is cryptographically signed for authenticity.
            <Paragraph
              color="$blue10"
              fontSize="$1"
              textDecorationLine="underline"
              onPress={() => {
                if (isWeb) {
                  window.open("https://contentcredentials.org", "_blank");
                }
              }}
            >
              {" "}Learn more
            </Paragraph>
          </Paragraph>
        </XStack>
      </View>
    </View>
  );
}