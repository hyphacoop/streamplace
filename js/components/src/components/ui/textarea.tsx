import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { bg, borders, p, text, w } from "../../lib/theme/atoms";

function Textarea({
  style,
  multiline = true,
  numberOfLines = 4,
  ...props
}: TextInputProps & {
  ref?: React.RefObject<TextInput>;
}) {
  return (
    <TextInput
      style={[
        w.percent[100],
        borders.width.thin,
        borders.color.gray[400],
        bg.gray[900],
        p[3],
        text.gray[200],
        props.editable === false && { opacity: 0.5 },
        { borderRadius: 10 },
        style,
      ]}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      {...props}
    />
  );
}

export { Textarea };
