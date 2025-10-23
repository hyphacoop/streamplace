import { openAuthSessionAsync } from "expo-web-browser";
import { PermissionsAndroid, Platform } from "react-native";
import { AppStore } from "store";
import { StateCreator } from "zustand";

export interface PlatformSlice {
  status: "idle" | "loading" | "failed";
  notificationToken: string | null;
  notificationDestination: string | null;
  // actions
  handleNotification: (payload?: { [key: string]: string | object }) => void;
  clearNotification: () => void;
  openLoginLink: (url: string) => Promise<void>;
  initPushNotifications: () => Promise<void>;
  registerNotificationToken: () => Promise<void>;
}

const checkApplicationPermission = async () => {
  if (Platform.OS === "android") {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } catch (error) {
      console.log("error getting notifications ", error);
    }
  }
};

export const createPlatformSlice: StateCreator<
  AppStore,
  [],
  [],
  PlatformSlice
> = (set, get) => ({
  status: "idle",
  notificationToken: null,
  notificationDestination: null,
  handleNotification: (payload) => {
    // notification handling logic
  },
  clearNotification: () => {
    set({ notificationDestination: null });
  },
  openLoginLink: async (url: string) => {
    set({ status: "loading" });
    try {
      const res = await openAuthSessionAsync(url);
      set({ status: "idle" });
      if (res.type === "success") {
        // do oauth callback
        get().oauthCallback(res.url);
      }
    } catch (error) {
      set({ status: "failed" });
    }
  },
  initPushNotifications: async () => {
    // mobile-only, web notifications someday
  },
  registerNotificationToken: async () => {
    // notification token registration
  },
});
