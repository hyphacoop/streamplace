import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

export default function useTitle(user: string) {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      title: `@${user} on Streamplace`,
    });
  }, [user, navigation]);
}
