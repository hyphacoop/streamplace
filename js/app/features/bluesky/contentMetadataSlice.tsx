import { createAppSlice } from "../../hooks/createSlice";
import { BlueskyState } from "./blueskyTypes";

export interface ContentMetadataState {
  creating: boolean;
  updating: boolean;
  error: string | null;
  metadata: any | null;
  metadataCache: { [key: string]: any };
}

const initialState: ContentMetadataState = {
  creating: false,
  updating: false,
  error: null,
  metadata: null,
  metadataCache: {},
};

export const contentMetadataSlice = createAppSlice({
  name: "contentMetadata",
  initialState,
  reducers: (create) => ({
    saveContentMetadata: create.asyncThunk(
      async (
        payload: {
          contentWarnings?: string[];
          distributionPolicy?: {
            allowArchive?: boolean;
            broadcastExpiry?: string;
          };
          contentRights?: Record<string, any>;
        },
        thunkAPI,
      ) => {
        const { bluesky } = thunkAPI.getState() as { bluesky: BlueskyState };

        if (!bluesky.pdsAgent || !bluesky.oauthSession?.did) {
          throw new Error("Not authenticated");
        }

        const metadataRecord = {
          $type: "place.stream.default.metadata",
          createdAt: new Date().toISOString(),
          ...(payload.contentWarnings &&
            payload.contentWarnings.length > 0 && {
              contentWarnings: payload.contentWarnings,
            }),
          distributionPolicy: payload.distributionPolicy || {
            allowArchive: true,
          },
          ...(payload.contentRights &&
            Object.keys(payload.contentRights).length > 0 && {
              contentRights: payload.contentRights,
            }),
        };

        const result = await bluesky.pdsAgent.com.atproto.repo.putRecord({
          repo: bluesky.oauthSession.did,
          collection: "place.stream.default.metadata",
          rkey: "self",
          record: metadataRecord,
        });

        return metadataRecord;
      },
      {
        pending: (state) => ({
          ...state,
          creating: true,
          updating: true,
          error: null,
        }),
        fulfilled: (state, action) => ({
          ...state,
          creating: false,
          updating: false,
          metadata: action.payload,
        }),
        rejected: (state, action) => ({
          ...state,
          creating: false,
          updating: false,
          error: action.error?.message || "Failed to save metadata",
        }),
      },
    ),

    getContentMetadata: create.asyncThunk(
      async (payload: { userDid?: string; rkey?: string } = {}, thunkAPI) => {
        const { bluesky } = thunkAPI.getState() as { bluesky: BlueskyState };
        const { userDid, rkey = "self" } = payload;

        if (!bluesky.pdsAgent || !bluesky.oauthSession?.did) {
          throw new Error("Not authenticated");
        }

        const targetDid = userDid || bluesky.oauthSession?.did;
        if (!targetDid) {
          throw new Error("No DID provided");
        }

        try {
          // Use the authenticated pdsAgent to ensure proper DPoP authentication
          const result = await bluesky.pdsAgent.com.atproto.repo.getRecord({
            repo: targetDid,
            collection: "place.stream.default.metadata",
            rkey,
          });

          return {
            userDid: targetDid,
            record: result.success ? result.data.value : null,
            uri: result.success ? result.data.uri : null,
            cid: result.success ? result.data.cid : null,
          };
        } catch (error) {
          // Return null for not found, rather than throwing
          if (
            error.message?.includes("not found") ||
            error.message?.includes("RecordNotFound")
          ) {
            return { userDid: targetDid, record: null, uri: null, cid: null };
          }
          throw error;
        }
      },
      {
        pending: (state) => ({ ...state, error: null }),
        fulfilled: (state, action) => {
          const { userDid, record } = action.payload;
          return {
            ...state,
            error: null,
            metadata: record,
            metadataCache: { ...state.metadataCache, [userDid]: record },
          };
        },
        rejected: (state, action) => ({
          ...state,
          error: action.error?.message || "Failed to get metadata",
        }),
      },
    ),

    getMultipleMetadata: create.asyncThunk(
      async (userDids: string[], thunkAPI) => {
        const { bluesky } = thunkAPI.getState() as { bluesky: BlueskyState };

        if (!bluesky.pdsAgent || !bluesky.oauthSession?.did) {
          throw new Error("Not authenticated");
        }

        const results: { [key: string]: any } = {};

        // Process each DID using the authenticated agent
        for (const userDid of userDids) {
          try {
            const result = await bluesky.pdsAgent.com.atproto.repo.getRecord({
              repo: userDid,
              collection: "place.stream.default.metadata",
              rkey: "self",
            });

            results[userDid] = result.success ? result.data.value : null;
          } catch (error) {
            // Set to null for not found or any other error
            results[userDid] = null;
          }
        }

        return results;
      },
      {
        pending: (state) => ({ ...state, error: null }),
        fulfilled: (state, action) => ({
          ...state,
          error: null,
          metadataCache: { ...state.metadataCache, ...action.payload },
        }),
        rejected: (state, action) => ({
          ...state,
          error: action.error?.message || "Failed to get multiple metadata",
        }),
      },
    ),

    clearError: create.reducer((state) => ({ ...state, error: null })),

    updateMultipleMetadataFromPoller: create.reducer(
      (state, action: { payload: { [key: string]: any } }) => ({
        ...state,
        metadataCache: action.payload, // Replace cache with live users only
      }),
    ),
  }),

  selectors: {
    selectContentMetadata: (state) => state,
    selectIsCreating: (state) => state.creating,
    selectIsUpdating: (state) => state.updating,
    selectError: (state) => state.error,
    selectMetadata: (state) => state.metadata,
    selectCachedMetadata: (state) => state.metadataCache,
  },
});

export const {
  saveContentMetadata,
  getContentMetadata,
  getMultipleMetadata,
  clearError,
  updateMultipleMetadataFromPoller,
} = contentMetadataSlice.actions;

export const {
  selectContentMetadata,
  selectIsCreating,
  selectIsUpdating,
  selectError,
  selectMetadata,
  selectCachedMetadata,
} = contentMetadataSlice.selectors;
