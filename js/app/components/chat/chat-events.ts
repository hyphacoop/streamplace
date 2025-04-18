import { EventEmitter } from "events";
import { MessageViewHydrated } from "features/player/playerSlice";

// Create a global event emitter for cross-platform event handling
const globalEventEmitter = new EventEmitter();

export const chatEvents = {
  emitter: globalEventEmitter,
  REPLY: "chat:reply",
  reply: (message: MessageViewHydrated) => {
    globalEventEmitter.emit("chat:reply", message);
  },
};
