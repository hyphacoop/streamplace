import { Text, zero } from "@streamplace/components";
import { Platform, Pressable, View } from "react-native";

const isWeb = Platform.OS === "web";

// Note: Toast functionality removed - this is now a placeholder implementation
// In a real app, you might want to use a toast library like react-native-toast-message
// or implement a simple alert/modal system

export function CurrentToast() {
  // Toast functionality removed - would need replacement with simple modal or alert
  return null;
}

export function ToastControl() {
  // Note: This was a demo component for testing toasts
  return (
    <View style={[{ gap: 8 }, zero.layout.flex.alignCenter]}>
      <Text style={[{ fontSize: 18, fontWeight: "bold" }]}>
        Toast demo (disabled)
      </Text>
      <View
        style={[
          zero.layout.flex.row,
          { gap: 8 },
          zero.layout.flex.justifyCenter,
        ]}
      >
        <Pressable
          style={[
            {
              backgroundColor: "#0066cc",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            },
          ]}
          onPress={() => {
            // Would show toast: "Successfully saved!" with message: "Don't worry, we've got your data."
            console.log("Toast would show: Successfully saved!");
          }}
        >
          <Text style={{ color: "white" }}>Show</Text>
        </Pressable>
        <Pressable
          style={[
            {
              backgroundColor: "#666",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            },
          ]}
          onPress={() => {
            // Would hide toast
            console.log("Toast would hide");
          }}
        >
          <Text style={{ color: "white" }}>Hide</Text>
        </Pressable>
      </View>
    </View>
  );
}
