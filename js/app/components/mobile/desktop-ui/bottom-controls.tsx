import {
  Button,
  PlayerUI,
  View,
  usePlayerStore,
  useTheme,
  zero,
} from "@streamplace/components";
import {
  ChevronLeft,
  ChevronRight,
  Fullscreen,
  Minimize,
  PictureInPicture2,
} from "lucide-react-native";
import { Platform, Pressable } from "react-native";
import { VolumeSlider } from "./volume-slider";

const { gap, layout, p, r } = zero;

interface BottomControlBarProps {
  ingest: string | null;
  pipSupported: boolean;
  pipActive: boolean;
  onHandlePip: () => void;
  dropdownPortalContainer?: any;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

export function BottomControlBar({
  ingest,
  pipSupported,
  pipActive,
  onHandlePip,
  dropdownPortalContainer,
  showChat,
  setShowChat,
}: BottomControlBarProps) {
  let { theme } = useTheme();
  const fullscreen = usePlayerStore((state) => state.fullscreen);
  const setFullscreen = usePlayerStore((state) => state.setFullscreen);

  return (
    <View
      style={[
        layout.flex.row,
        layout.flex.spaceBetween,
        layout.flex.alignCenter,
      ]}
    >
      <View style={[layout.flex.row, layout.flex.alignCenter, gap.all[4]]}>
        <VolumeSlider />
      </View>

      <View style={[layout.flex.row, layout.flex.alignCenter, gap.all[3]]}>
        {Platform.OS === "web" && pipSupported && (
          <Pressable onPress={onHandlePip} disabled={pipActive}>
            <View style={{ opacity: pipActive ? 0.5 : 1 }}>
              <PictureInPicture2 />
            </View>
          </Pressable>
        )}
        {ingest === null && (
          <PlayerUI.ContextMenu
            dropdownPortalContainer={dropdownPortalContainer}
          />
        )}
        {Platform.OS === "web" && (
          <Pressable
            onPress={() => {
              setFullscreen(!fullscreen);
            }}
            style={[p[2], r[1]]}
          >
            {fullscreen ? (
              <Minimize color={theme.colors.text} />
            ) : (
              <Fullscreen color={theme.colors.text} />
            )}
          </Pressable>
        )}
        {/* if not web, then add the collapse chat controls here */}
        {Platform.OS !== "web" && (
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              setShowChat(!showChat);
            }}
          >
            {showChat ? (
              <ChevronRight color="white" size={16} />
            ) : (
              <ChevronLeft color="white" size={16} />
            )}
          </Button>
        )}
      </View>
    </View>
  );
}
