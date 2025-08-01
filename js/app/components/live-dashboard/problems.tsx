import { useLivestreamStore } from "@streamplace/components";
import { LivestreamProblem } from "@streamplace/components/src/livestream-store/livestream-state";
import { ExternalLink } from "@tamagui/lucide-icons";
import { useState } from "react";
import { Linking, Pressable } from "react-native";
import { Button, H3, Text, View } from "tamagui";

const Problems = ({
  probs,
  onIgnore,
}: {
  probs: LivestreamProblem[];
  onIgnore: () => void;
}) => {
  return (
    <View gap={"$3"}>
      <View>
        <H3>Optimize Your Stream</H3>
        <Text>
          We’ve found a few things that could improve your stream’s reliability.
        </Text>
      </View>
      {probs.map((p) => (
        <View>
          <View gap="$2" key={p.message} flexDirection="row" ai="flex-start">
            <Text
              borderRadius="$2"
              px="$2"
              width={82}
              textAlign="center"
              bg={
                p.severity === "error"
                  ? "$red8Dark"
                  : p.severity === "warning"
                    ? "$yellow8Dark"
                    : "$blue8Dark"
              }
            >
              {p.severity}
            </Text>
            <View flex={1} gap="$1">
              <Text>{p.code}</Text>
              <Text color="$gray11Dark" fontSize="$6">
                {p.message}
              </Text>
              {p.link && (
                <Pressable onPress={() => p.link && Linking.openURL(p.link)}>
                  <View flexDirection="row" ai="center" gap="$2">
                    <Text color="$blue10" fontSize="$6">
                      Learn More
                    </Text>
                    <ExternalLink size="$1" />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ))}

      <Button onPress={onIgnore}>
        <Text>Ignore</Text>
      </Button>
    </View>
  );
};

export const ProblemsWrapper = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const problems = useLivestreamStore((x) => x.problems);
  const [dismiss, setDismiss] = useState(false);

  return (
    <View position="relative" f={1} ai="center" jc="center" fb={0}>
      {children}
      {problems.length > 0 && !dismiss && (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0, 0, 0, 0.8)"
          ai="center"
          jc="flex-start"
          zIndex={100}
          padding="$8"
        >
          <View
            backgroundColor="$gray1"
            borderColor="$gray5"
            borderWidth={1}
            borderRadius="$4"
            padding="$4"
            maxWidth={700}
            width="100%"
          >
            <Problems probs={problems} onIgnore={() => setDismiss(true)} />
          </View>
        </View>
      )}
    </View>
  );
};
