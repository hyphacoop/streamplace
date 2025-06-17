import {
  PlayerProtocol,
  useLivestreamStore,
  usePlayerStore,
} from "@streamplace/components";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuInfo,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  ResponsiveDropdownMenuContent,
  Text,
} from "@streamplace/components/src/components/ui";
import { colors } from "@streamplace/components/src/lib/theme";
import { Menu } from "lucide-react-native";

export default function ContextMenu() {
  const quality = usePlayerStore((x) => x.selectedRendition);
  const setQuality = usePlayerStore((x) => x.setSelectedRendition);
  const qualities = useLivestreamStore((x) => x.renditions);

  const protocol = usePlayerStore((x) => x.protocol);
  const setProtocol = usePlayerStore((x) => x.setProtocol);

  const lowLatency = protocol === "webrtc";
  const setLowLatency = (value: boolean) => {
    setProtocol(value ? PlayerProtocol.WEBRTC : PlayerProtocol.HLS);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Menu size={32} color={colors.gray[200]} />
      </DropdownMenuTrigger>
      <ResponsiveDropdownMenuContent>
        <DropdownMenuGroup title="Resolution">
          <DropdownMenuRadioGroup value={quality} onValueChange={setQuality}>
            <DropdownMenuRadioItem value="source">
              <Text>Source</Text>
            </DropdownMenuRadioItem>
            {qualities.map((r) => (
              <DropdownMenuRadioItem value={r.name}>
                <Text>{r.name}</Text>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuGroup title="Advanced">
          <DropdownMenuCheckboxItem
            checked={lowLatency}
            onCheckedChange={() => setLowLatency(!lowLatency)}
          >
            <Text>Low Latency</Text>
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuInfo description="Lowers the delay between video and chat messages." />
      </ResponsiveDropdownMenuContent>
    </DropdownMenu>
  );
}
