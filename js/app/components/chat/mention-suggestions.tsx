import { ScrollView, Text, View } from "tamagui";
import { TouchableOpacity } from "react-native";

export interface MentionSuggestion {
  did: string;
  handle: string;
  color?: {
    red: number;
    green: number;
    blue: number;
  };
}

interface MentionSuggestionsProps {
  suggestions: MentionSuggestion[];
  onSelect: (suggestion: MentionSuggestion) => void;
  position: { top: number; left: number };
}

export default function MentionSuggestions({
  suggestions,
  onSelect,
  position,
}: MentionSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const getRgbColor = (color?: MentionSuggestion["color"]) =>
    color ? `rgb(${color.red}, ${color.green}, ${color.blue})` : "$accentColor";

  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      backgroundColor="white"
      borderRadius={4}
      maxHeight={200}
      minWidth={200}
      zIndex={100000}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={4}
      style={{
        pointerEvents: "auto",
        border: "2px solid red",
      }}
    >
      <ScrollView>
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.did}
            onPress={() => onSelect(suggestion)}
          >
            <View
              padding="$2"
              hoverStyle={{ backgroundColor: "$background3" }}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "$borderColor",
              }}
            >
              <Text fontSize={14} color={getRgbColor(suggestion.color)}>
                @{suggestion.handle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
