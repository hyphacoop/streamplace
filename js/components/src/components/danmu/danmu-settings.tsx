import { Settings } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Switch } from "react-native";
import { usePlayerStore } from "../../player-store";
import { Text, View } from "../ui";

export function DanmuSettings() {
  const [isOpen, setIsOpen] = useState(false);

  const danmuEnabled = usePlayerStore((x) => x.danmuEnabled);
  const setDanmuEnabled = usePlayerStore((x) => x.setDanmuEnabled);

  const danmuOpacity = usePlayerStore((x) => x.danmuOpacity);
  const setDanmuOpacity = usePlayerStore((x) => x.setDanmuOpacity);

  const danmuSpeed = usePlayerStore((x) => x.danmuSpeed);
  const setDanmuSpeed = usePlayerStore((x) => x.setDanmuSpeed);

  return (
    <>
      <Pressable onPress={() => setIsOpen(true)} style={styles.triggerButton}>
        <Settings color="white" size={20} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Danmu Settings</Text>

            <View style={styles.setting}>
              <Text style={styles.label}>Enable Danmu</Text>
              <Switch value={danmuEnabled} onValueChange={setDanmuEnabled} />
            </View>

            <View style={styles.setting}>
              <Text style={styles.label}>Opacity: {danmuOpacity}%</Text>
              <View style={styles.sliderContainer}>
                {[0, 25, 50, 75, 100].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setDanmuOpacity(value)}
                    style={[
                      styles.sliderButton,
                      danmuOpacity === value && styles.sliderButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sliderButtonText,
                        danmuOpacity === value &&
                          (styles.sliderButtonTextActive as any),
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.setting}>
              <Text style={styles.label}>Speed</Text>
              <View style={styles.sliderContainer}>
                {[
                  { label: "0.5×", value: 0.5 },
                  { label: "1×", value: 1 },
                  { label: "1.5×", value: 1.5 },
                  { label: "2×", value: 2 },
                ].map(({ label, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setDanmuSpeed(value)}
                    style={[
                      styles.sliderButton,
                      danmuSpeed === value && styles.sliderButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sliderButtonText,
                        danmuSpeed === value &&
                          (styles.sliderButtonTextActive as any),
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  setting: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#d1d5db",
    fontWeight: "600",
  },
  sliderContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sliderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#374151",
    borderRadius: 6,
    minWidth: 50,
    alignItems: "center",
  },
  sliderButtonActive: {
    backgroundColor: "#3b82f6",
  },
  sliderButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  sliderButtonTextActive: {
    color: "white",
  },
  closeButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#374151",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
