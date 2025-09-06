import { Text } from "@streamplace/components";
import { Linking, Pressable, View } from "react-native";
import GetApps from "../../components/get-apps";

const H4 = ({ style, ...props }: any) => (
  <Text style={[{ fontSize: 18, fontWeight: "100" }, style]} {...props} />
);
const P = (props: any) => (
  <Text style={[{ fontSize: 13, marginBottom: 20 }, props.style]} {...props} />
);

const Anchor = ({
  href,
  children,
  style,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  style?: any;
}) => (
  <Pressable onPress={() => Linking.openURL(href)} {...props}>
    <Text
      style={[{ color: "#0066cc", textDecorationLine: "underline" }, style]}
    >
      {children}
    </Text>
  </Pressable>
);

export default function AboutScreen() {
  return (
    <View
      style={[
        { maxWidth: 500, marginHorizontal: "auto" },
        { flex: 1 },
        { alignItems: "center" },
        { justifyContent: "center" },
      ]}
    >
      <GetApps />
      <H4 style={[{ padding: 40 }, { textAlign: "center" }]}>Or:</H4>
      <Anchor
        href="https://git.stream.place/streamplace/streamplace/-/releases"
        style={[{ fontSize: 20 }, { textAlign: "center" }]}
      >
        Get the latest releases for Windows, Mac, and Linux from
        git.stream.place
      </Anchor>
    </View>
  );
}
