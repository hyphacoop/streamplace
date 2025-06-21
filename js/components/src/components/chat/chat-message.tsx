import { $Typed } from "@atproto/api";
import {
  Link,
  Mention,
} from "@atproto/api/dist/client/types/app/bsky/richtext/facet";
import { memo, useCallback } from "react";
import { Linking, View } from "react-native";
import { ChatMessageViewHydrated } from "streamplace";
import { RichtextSegment, segmentize } from "../../lib/facet";
import { borders, flex, gap, ml, w } from "../../lib/theme/atoms";
import { atoms, layout } from "../ui";

interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<{
    $type: string;
    uri?: string;
    did?: string;
  }>;
}

import { Text } from "../ui/text";

const getRgbColor = (color?: { red: number; green: number; blue: number }) =>
  color ? `rgb(${color.red}, ${color.green}, ${color.blue})` : "$accentColor";

const segmentedObject = (
  obj: RichtextSegment,
  index: number,
  userCache?: Map<string, ChatMessageViewHydrated["chatProfile"]>,
) => {
  if (obj.features && obj.features.length > 0) {
    let ftr = obj.features[0];
    // afaik there shouldn't be a case where facets overlap, at least currently
    if (ftr.$type === "app.bsky.richtext.facet#link") {
      let linkftr = ftr as $Typed<Link>;
      return (
        <Text
          key={`mention-${index}`}
          style={[{ color: atoms.colors.ios.systemBlue, cursor: "pointer" }]}
          onPress={() => Linking.openURL(linkftr.uri || "")}
        >
          {obj.text}
        </Text>
      );
    } else if (ftr.$type === "app.bsky.richtext.facet#mention") {
      let mtnftr = ftr as $Typed<Mention>;
      const profile = userCache?.get(mtnftr.did);
      return (
        <Text
          key={`mention-${index}`}
          style={[
            {
              cursor: "pointer",
              color: getRgbColor(profile?.color),
            },
          ]}
          onPress={() =>
            Linking.openURL(`https://bsky.app/profile/${mtnftr.did || ""}`)
          }
        >
          {obj.text}
        </Text>
      );
    }
  } else {
    return <Text key={`text-${index}`}>{obj.text}</Text>;
  }
};

const RichTextMessage = ({
  text,
  facets,
  userCache,
}: {
  text: string;
  facets: ChatMessageViewHydrated["record"]["facets"];
  userCache?: Map<string, ChatMessageViewHydrated["chatProfile"]>;
}) => {
  if (!facets?.length) return <Text>{text}</Text>;

  let segs = segmentize(text, facets as Facet[]);

  return segs.map((seg, i) => segmentedObject(seg, i, userCache));
};
export const RenderChatMessage = memo(
  function RenderChatMessage({
    item,
    userCache,
  }: {
    item: ChatMessageViewHydrated;
    userCache?: Map<string, ChatMessageViewHydrated["chatProfile"]>;
  }) {
    const formatTime = useCallback((dateString: string) => {
      return new Date(dateString).toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }, []);

    return (
      <>
        {item.replyTo && (
          <View
            style={[
              gap.all[2],
              layout.flex.row,
              w.percent[100],
              borders.left.width.medium,
              ml[2],
            ]}
          >
            <View
              style={[
                {
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: getRgbColor(item.chatProfile?.color),
                },
                borders.width.thin,
                borders.color.gray[700],
              ]}
            />
            <Text
              style={{
                color: getRgbColor((item.replyTo.chatProfile as any).color),
                fontWeight: "bold",
              }}
            ></Text>
            <Text
              style={{
                color: atoms.colors.gray[300],
                fontStyle: "italic",
              }}
            >
              {(item.replyTo.record as any).text}
            </Text>
          </View>
        )}
        <View style={[gap.all[2], layout.flex.row, w.percent[100]]}>
          <Text
            style={{
              fontVariant: ["tabular-nums"],
              color: atoms.colors.gray[300],
            }}
          >
            {formatTime(item.record.createdAt)}
          </Text>
          <Text weight="bold" color="default" style={[flex.shrink[1]]}>
            <Text
              style={[
                {
                  cursor: "pointer",
                  color: getRgbColor(item.chatProfile?.color),
                },
              ]}
            >
              @{item.author.handle}
            </Text>
            :{" "}
            <RichTextMessage
              text={item.record.text}
              facets={item.record.facets || []}
              userCache={userCache}
            />
          </Text>
        </View>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.author.handle === nextProps.item.author.handle &&
      prevProps.item.record.text === nextProps.item.record.text
    );
  },
);
