import { H2, View } from "tamagui";
import pkg from "../../package.json";

// maybe someday some PWA update stuff will live here
export function Updates() {
  return (
    <View alignItems="center" justifyContent="center" flexBasis={0} py="$6">
      <View>
        <H2 textAlign="center">Streamplace v{pkg.version}</H2>
      </View>
    </View>
  );
}
