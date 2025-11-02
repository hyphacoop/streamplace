import { Eye } from "lucide-react-native";
import { StyleSheet } from "react-native";
import * as atoms from "../../../lib/theme/atoms";
import { useViewers } from "../../../livestream-store";
import { View } from "../../ui";
import ViewerCount from "./viewer-count";

export function Viewers() {
  const viewers = useViewers();
  return (
    <View style={styles.container}>
      <Eye color="#fd5050" />
      <ViewerCount count={viewers} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: StyleSheet.flatten([
    atoms.layout.flex.center,
    atoms.layout.flex.row,
    atoms.gap.all[2],
  ]),
});

export default Viewers;
