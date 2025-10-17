import { createAppSlice } from "../../hooks/createSlice";
import { BlueskyState } from "./blueskyTypes";

export interface ContentMetadataState {
  creating: boolean;
  updating: boolean;
  error: string | null;
  lastCreatedRecord: any | null;
}

const initialState: ContentMetadataState = {
  creating: false,
  updating: false,
  error: null,
  lastCreatedRecord: null,
};

export const contentMetadataSlice = createAppSlice({
  name: "contentMetadata",
  initialState,
  reducers: (create) => ({
    createContentMetadata: create.asyncThunk(
      async (
        {
          contentWarnings = [],
          distributionPolicy = {
            deleteAfter: undefined,
          },
          contentRights = {},
        }: {
          contentWarnings?: string[];
          distributionPolicy?: {
            deleteAfter?: number;
          };
          contentRights?: {
            creator?: string;
            copyrightNotice?: string;
            copyrightYear?: number;
            license?: string;
            creditLine?: string;
          };
        },
        thunkAPI,
      ) => {
        const { bluesky } = thunkAPI.getState() as {
          bluesky: BlueskyState;
        };

        if (!bluesky.pdsAgent) {
          throw new Error("No agent");
        }

        const did = bluesky.oauthSession?.did;
        if (!did) {
          throw new Error("No DID");
        }

        const metadataRecord = {
          $type: "place.stream.metadata.configuration",
          createdAt: new Date().toISOString(),
          ...(contentWarnings.length > 0 && {
            contentWarnings: { warnings: contentWarnings },
          }),
          ...(distributionPolicy.deleteAfter && { distributionPolicy }),
          ...(contentRights &&
            Object.keys(contentRights).length > 0 && {
              contentRights,
            }),
        };

        const result = await bluesky.pdsAgent.com.atproto.repo.createRecord({
          repo: did,
          collection: "place.stream.metadata.configuration",
          rkey: "self",
          record: metadataRecord,
        });

        // Extract rkey from the URI
        const rkey = result.data.uri.split("/").pop();

        return {
          record: metadataRecord,
          uri: result.data.uri,
          cid: result.data.cid,
          rkey,
        };
      },
      {
        pending: (state) => {
          return {
            ...state,
            creating: true,
            error: null,
          };
        },
        fulfilled: (state, action) => {
          return {
            ...state,
            creating: false,
            error: null,
            lastCreatedRecord: action.payload,
          };
        },
        rejected: (state, action) => {
          return {
            ...state,
            creating: false,
            error: action.error?.message ?? "Failed to create content metadata",
          };
        },
      },
    ),

    updateContentMetadata: create.asyncThunk(
      async (
        {
          rkey,
          livestreamRef,
          contentWarnings = [],
          distributionPolicy = {
            deleteAfter: undefined, // No expiration means forever
          },
          contentRights = {},
        }: {
          rkey?: string;
          livestreamRef?: {
            uri: string;
            cid: string;
          };
          contentWarnings?: string[];
          distributionPolicy?: {
            deleteAfter?: number;
          };
          contentRights?: {
            creator?: string;
            copyrightNotice?: string;
            copyrightYear?: number;
            license?: string;
            creditLine?: string;
          };
        },
        thunkAPI,
      ) => {
        const { bluesky } = thunkAPI.getState() as {
          bluesky: BlueskyState;
        };

        if (!bluesky.pdsAgent) {
          throw new Error("No agent");
        }

        const did = bluesky.oauthSession?.did;
        if (!did) {
          throw new Error("No DID");
        }

        const metadataRecord = {
          $type: "place.stream.metadata.configuration",
          ...(livestreamRef && { livestreamRef }),
          createdAt: new Date().toISOString(),
          ...(contentWarnings.length > 0 && {
            contentWarnings: { warnings: contentWarnings },
          }),
          ...(distributionPolicy.deleteAfter && { distributionPolicy }),
          ...(contentRights &&
            Object.keys(contentRights).length > 0 && {
              contentRights,
            }),
        };

        const result = await bluesky.pdsAgent.com.atproto.repo.putRecord({
          repo: did,
          collection: "place.stream.metadata.configuration",
          rkey: "self",
          record: metadataRecord,
        });

        return {
          record: metadataRecord,
          uri: `at://${did}/place.stream.metadata.configuration/self`,
          cid: result.data.cid,
        };
      },
      {
        pending: (state) => {
          return {
            ...state,
            updating: true,
            error: null,
          };
        },
        fulfilled: (state, action) => {
          return {
            ...state,
            updating: false,
            error: null,
            lastCreatedRecord: action.payload,
          };
        },
        rejected: (state, action) => {
          return {
            ...state,
            updating: false,
            error: action.error?.message ?? "Failed to update content metadata",
          };
        },
      },
    ),

    getContentMetadata: create.asyncThunk(
      async (
        { userDid, rkey = "self" }: { userDid?: string; rkey?: string } = {},
        thunkAPI,
      ) => {
        const { bluesky } = thunkAPI.getState() as {
          bluesky: BlueskyState;
        };

        if (!bluesky.pdsAgent) {
          throw new Error("No agent");
        }

        // Use provided userDid or fall back to current user's DID
        const targetDid = userDid || bluesky.oauthSession?.did;
        if (!targetDid) {
          throw new Error("No DID provided or user not authenticated");
        }

        // Add debugging information
        console.log(`[getContentMetadata] Debug info:`, {
          targetDid,
          rkey,
          pdsAgentType: bluesky.pdsAgent.constructor.name,
          hasOAuthSession: !!bluesky.oauthSession,
          currentUserDid: bluesky.oauthSession?.did,
          pdsAgentHost:
            (bluesky.pdsAgent as any)?.host ||
            (bluesky.pdsAgent as any)?.service?.host ||
            "unknown",
          pdsAgentUrl:
            (bluesky.pdsAgent as any)?.url ||
            (bluesky.pdsAgent as any)?.service?.url ||
            "unknown",
        });

        try {
          // First, try to resolve the correct PDS for the target user
          let targetPDS = null;
          try {
            const didResponse = await fetch(
              `https://plc.directory/${targetDid}`,
            );
            if (didResponse.ok) {
              const didDoc = await didResponse.json();
              const pdsService = didDoc.service?.find(
                (s: any) => s.id === "#atproto_pds",
              );
              if (pdsService) {
                targetPDS = pdsService.serviceEndpoint;
                console.log(
                  `[getContentMetadata] Resolved PDS for ${targetDid}:`,
                  targetPDS,
                );
              }
            }
          } catch (pdsResolveError) {
            console.log(
              `[getContentMetadata] Failed to resolve PDS for ${targetDid}:`,
              pdsResolveError,
            );
          }

          // Use the target PDS if available, otherwise fall back to the current agent
          let agent = bluesky.pdsAgent;
          if (targetPDS && targetPDS !== (bluesky.pdsAgent as any)?.host) {
            // Create a new agent pointing to the target PDS
            const { StreamplaceAgent } = await import("streamplace");
            agent = new StreamplaceAgent(targetPDS) as any;
            console.log(
              `[getContentMetadata] Created new agent for PDS:`,
              targetPDS,
            );
          }

          console.log(`[getContentMetadata] Attempting to fetch record from:`, {
            repo: targetDid,
            collection: "place.stream.metadata.configuration",
            rkey,
            usingPDS: targetPDS || "default",
          });

          const result = await agent.com.atproto.repo.getRecord({
            repo: targetDid,
            collection: "place.stream.metadata.configuration",
            rkey,
          });

          console.log(`[getContentMetadata] API response:`, result);

          if (!result.success) {
            throw new Error("Failed to get content metadata record");
          }

          return {
            userDid: targetDid,
            record: result.data.value,
            uri: result.data.uri,
            cid: result.data.cid,
          };
        } catch (error) {
          console.log(`[getContentMetadata] Error details:`, {
            error: error.message,
            errorType: error.constructor.name,
            errorStack: error.stack,
          });

          // If user doesn't have metadata record, return null instead of throwing
          if (
            error.message?.includes("not found") ||
            error.message?.includes("RecordNotFound")
          ) {
            return {
              userDid: targetDid,
              record: null,
              uri: null,
              cid: null,
            };
          }
          throw error;
        }
      },
      {
        pending: (state) => {
          return {
            ...state,
            error: null,
          };
        },
        fulfilled: (state, action) => {
          return {
            ...state,
            error: null,
            lastCreatedRecord: action.payload,
          };
        },
        rejected: (state, action) => {
          return {
            ...state,
            error: action.error?.message ?? "Failed to get content metadata",
          };
        },
      },
    ),

    clearError: create.reducer((state) => {
      return {
        ...state,
        error: null,
      };
    }),
  }),

  selectors: {
    selectContentMetadata: (state) => state,
    selectIsCreating: (state) => state.creating,
    selectIsUpdating: (state) => state.updating,
    selectError: (state) => state.error,
    selectLastCreatedRecord: (state) => state.lastCreatedRecord,
  },
});

export const {
  createContentMetadata,
  updateContentMetadata,
  getContentMetadata,
  clearError,
} = contentMetadataSlice.actions;

export const {
  selectContentMetadata,
  selectIsCreating,
  selectIsUpdating,
  selectError,
  selectLastCreatedRecord,
} = contentMetadataSlice.selectors;
