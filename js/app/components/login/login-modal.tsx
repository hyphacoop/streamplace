import { Text, useTheme, zero } from "@streamplace/components";
import { X } from "lucide-react-native";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import LoginForm from "./login-form";

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          zero.layout.flex[1],
          zero.layout.flex.center,
          zero.layout.flex.alignCenter,
          zero.layout.flex.justifyCenter,
          {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
          },
        ]}
      >
        <Pressable
          style={[
            zero.bg.gray[900],
            zero.r.xl,
            zero.p[6],
            { width: 600, maxWidth: "90%", maxHeight: "85%" },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              zero.layout.flex.row,
              zero.layout.flex.spaceBetween,
              zero.layout.flex.alignCenter,
              zero.mb[5],
            ]}
          >
            <Text style={[{ fontSize: 36, fontWeight: "200", color: "white" }]}>
              Log in
            </Text>
            <TouchableOpacity
              style={[zero.p[1]]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#888" size={24} />
            </TouchableOpacity>
          </View>

          <LoginForm onSuccess={onClose} />
        </Pressable>
      </View>
    </Modal>
  );
}
