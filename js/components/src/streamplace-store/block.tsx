import { AppBskyGraphBlock } from "@atproto/api";
import { usePDSAgent } from "./xrpc";

export function useCreateBlockRecord() {
  let agent = usePDSAgent();

  return async (subjectDID: string) => {
    if (!agent) {
      throw new Error("No PDS agent found");
    }

    if (!agent.did) {
      throw new Error("No user DID found, assuming not logged in");
    }

    const record: AppBskyGraphBlock.Record = {
      $type: "app.bsky.graph.block",
      subject: subjectDID,
      createdAt: new Date().toISOString(),
    };
    return await agent.com.atproto.repo.createRecord({
      repo: agent.did,
      collection: "app.bsky.graph.block",
      record,
    });

    return record;
  };
}

export function useCreateHideChatRecord() {
  let agent = usePDSAgent();

  return async (chatMessageUri: string) => {
    if (!agent) {
      throw new Error("No PDS agent found");
    }

    if (!agent.did) {
      throw new Error("No user DID found, assuming not logged in");
    }

    const record = {
      $type: "place.stream.chat.gate",
      hiddenMessage: chatMessageUri,
    };

    return await agent.com.atproto.repo.createRecord({
      repo: agent.did,
      collection: "place.stream.chat.gate",
      record,
    });
  };
}
