import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";

export default function KeepAwake() {
  console.log("KeepAwake");
  // useKeepAwake();
  useEffect(() => {
    activateKeepAwakeAsync();
    const handle = setInterval(() => {
      console.log("KeepAwake");
    }, 1000);
    return () => {
      clearInterval(handle);
      console.log("KeepAwake clear");
      deactivateKeepAwake();
    };
  }, []);
  return <></>;
}
