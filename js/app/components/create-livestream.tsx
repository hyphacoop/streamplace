import { ContentMetadata, ContentMetadataForm } from "@streamplace/components";
import { useToastController } from "@tamagui/toast";
import ThumbnailSelector from "components/thumbnail-selector";
import {
  createLivestreamRecord,
  selectNewLivestream,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import { useCaptureVideoFrame } from "hooks/useCaptureVideoFrame";
import { useLiveUser } from "hooks/useLiveUser";
import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  Button,
  H3,
  Label,
  Paragraph,
  ScrollView,
  TextArea,
  View,
  XStack,
  YStack,
  isWeb,
} from "tamagui";

export default function CreateLivestream() {
  const dispatch = useAppDispatch();
  // Note: Toast functionality removed, would need simple alert replacement
  const userIsLive = useLiveUser();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [customThumbnail, setCustomThumbnail] = useState<Blob | undefined>(
    undefined,
  );
  const [contentMetadata, setContentMetadata] = useState<ContentMetadata>({
    contentWarnings: { warnings: [] },
    distributionPolicy: {
      deleteAfter: undefined, // No expiration means forever
    },
    contentRights: {},
  });
  const [showMetadata, setShowMetadata] = useState(false);
  const profile = useAppSelector(selectUserProfile);
  const newLivestream = useAppSelector(selectNewLivestream);
  const captureFrame = useCaptureVideoFrame();
  const { width } = useWindowDimensions();

  // Responsive layout logic
  const isWide = width > 1020;
  const useTwoColumns = isWide;

  useEffect(() => {
    if (newLivestream?.record) {
      // Would show toast: "Livestream announced" with newLivestream.record.title
      setTitle("");
      setCustomThumbnail(undefined);
      setContentMetadata({
        contentWarnings: { warnings: [] },
        distributionPolicy: {
          deleteAfter: undefined, // No expiration means forever
        },
        contentRights: {},
      });
      setShowMetadata(false);
    }
  }, [newLivestream?.record]);

  useEffect(() => {
    if (newLivestream?.error) {
      // Would show toast: "Error creating livestream" with error message
    }
  }, [newLivestream?.error]);

  const disabled = !userIsLive || loading || title === "";

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let thumbnailToUse = customThumbnail;
      if (!thumbnailToUse && isWeb && captureFrame) {
        const capturedFrame = await captureFrame(1280, 0.85);
        if (capturedFrame) {
          thumbnailToUse = capturedFrame;
        }
      }

      await dispatch(
        createLivestreamRecord({
          title,
          customThumbnail: thumbnailToUse,
        }),
      );
    } catch (error) {
      console.error("Error creating livestream:", error);
      // Would show toast: "Error creating livestream"
    } finally {
      setLoading(false);
    }
  };

  const buttonText = loading
    ? "Loading..."
    : !userIsLive
      ? "Waiting for stream to start..."
      : "Announce Livestream!";

  if (showMetadata) {
    return (
      <YStack f={1}>
        {/* Header with Back Button */}
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$2"
          backgroundColor="$background"
          borderBottomWidth={1}
          borderBottomColor="$gray4"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          <YStack alignItems="center">
            <H3 fontSize="$4">Content Metadata</H3>
            <Paragraph fontSize="$1" color="$gray11">
              Optional metadata for your livestream
            </Paragraph>
          </YStack>

          <View position="absolute" left="$3">
            <Button
              size="$2"
              variant="outlined"
              onPress={() => setShowMetadata(false)}
              icon={<Paragraph fontSize="$2">←</Paragraph>}
            >
              Back to Basic Info
            </Button>
          </View>
        </XStack>

        {/* Scrollable Content */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <YStack f={1} gap="$2" pb="$3">
            {/* Content Metadata Form */}
            <ContentMetadataForm
              onMetadataChange={setContentMetadata}
              initialMetadata={contentMetadata}
              showUpdateButton={true}
            />

            {/* Submit Button */}
            <View p="$2" alignItems="center">
              <Button
                disabled={disabled}
                opacity={disabled ? 0.5 : 1}
                size="$3"
                w="100%"
                maxWidth={400}
                onPress={handleSubmit}
              >
                {buttonText}
              </Button>
            </View>
          </YStack>
        </ScrollView>
      </YStack>
    );
  }

  return (
    <ScrollView
      style={{ width: "60%" }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingVertical: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          { flexDirection: useTwoColumns ? "row" : "column" },
          { gap: useTwoColumns ? 48 : 16 },
          { width: "100%" },
          { maxWidth: useTwoColumns ? 900 : undefined },
          { alignSelf: "center" },
          zero.p[4],
          { alignItems: useTwoColumns ? "flex-start" : "stretch" },
          { justifyContent: "center" },
        ]}
      >
        {/* Left column: labels and fields */}
        <View
          style={[
            { flex: 2, minWidth: 0 },
            { gap: 12 },
            { width: useTwoColumns ? 500 : "100%" },
          ]}
        >
          <View
            style={[
              { flexDirection: "row" },
              { alignItems: "center" },
              { width: "100%" },
            ]}
          >
            <Text
              style={[{ paddingBottom: 8, minWidth: 100, textAlign: "left" }]}
            >
              Streamer
            </Text>
            <Text style={[{ paddingBottom: 8, fontWeight: "bold" }]}>
              @{profile?.handle}
            </Text>
          </View>

          <View
            style={[
              { flexDirection: "row" },
              { alignItems: "center" },
              { width: "100%" },
            ]}
          >
            <Text
              style={[{ paddingBottom: 8, minWidth: 100, textAlign: "left" }]}
            >
              Title
            </Text>
            <View style={zero.flex.values[1]}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={140}
                style={[
                  {
                    minHeight: 100,
                    width: "100%",
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    padding: 12,
                    textAlignVertical: "top",
                  },
                ]}
                multiline
              />
            </View>
          </Label>
          <Label asChild={true}>
            <View flexDirection="row" alignItems="center" w="100%">
              <Paragraph pb="$2" minWidth={100} textAlign="left">
                Title
              </Paragraph>
              <View flex={1}>
                <TextArea
                  id="livestream-title"
                  value={title}
                  onChangeText={setTitle}
                  size="$4"
                  minHeight={100}
                  maxLength={140}
                  w="100%"
                />
              </View>
            </View>
          </Label>
          <View w="100%" alignItems="center" mt="$4" gap="$3">
            <Button
              size="$4"
              variant="outlined"
              onPress={() => setShowMetadata(true)}
            >
              Add Content Metadata
            </Button>
            <Button
              disabled={disabled}
              style={[
                {
                  opacity: disabled ? 0.5 : 1,
                  width: "100%",
                  backgroundColor: "#0066cc",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                },
              ]}
              onPress={handleSubmit}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                {buttonText}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Right column: thumbnail */}
        <View
          style={[
            { flex: 1, minWidth: 0 },
            { gap: 16 },
            { alignItems: "center" },
            { justifyContent: "flex-start" },
            { width: useTwoColumns ? 400 : "100%" },
            {
              marginTop: 12,
              ...(useTwoColumns ? {} : { marginLeft: 40 }),
            },
          ]}
        >
          <View
            style={[
              { flexDirection: "column" },
              { alignItems: "center" },
              { width: "100%" },
            ]}
          >
            <Text
              style={[
                {
                  paddingBottom: 0,
                  lineHeight: 18,
                  fontWeight: "bold",
                  marginBottom: 8,
                },
              ]}
            >
              Custom Thumbnail (Optional)
            </Text>
            <View style={[{ maxWidth: 400, width: "100%" }]}>
              <ThumbnailSelector onThumbnailSelected={setCustomThumbnail} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
