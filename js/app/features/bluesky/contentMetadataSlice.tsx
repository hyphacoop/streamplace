import { createAppSlice } from "../../hooks/createSlice";
import { BlueskyState } from "./blueskyTypes";

export interface ContentMetadataState {
  creating: boolean;
  updating: boolean;
  error: string | null;
  lastCreatedRecord: any | null;
  currentMetadataRkey: string | null;
}

const initialState: ContentMetadataState = {
  creating: false,
  updating: false,
  error: null,
  lastCreatedRecord: null,
  currentMetadataRkey: null,
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
            allowArchive: true,
          },
          rights = {},
        }: {
          contentWarnings?: string[];
          distributionPolicy?: {
            allowArchive?: boolean;
            broadcastUntil?: string;
          };
          rights?: {
            year?: string;
            attribution?: string;
            license?: string;
            usageTerms?: string;
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
          $type: "place.stream.default.metadata",
          createdAt: new Date().toISOString(),
          contentWarnings,
          rights,
          distributionPolicy,
        };

        const result = await bluesky.pdsAgent.com.atproto.repo.createRecord({
          repo: did,
          collection: "place.stream.default.metadata",
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
            currentMetadataRkey: action.payload.rkey ?? null,
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
            allowArchive: true,
            broadcastUntil: "2025-12-31T23:59:59Z",
          },
          rights = {},
        }: {
          rkey?: string;
          livestreamRef?: {
            uri: string;
            cid: string;
          };
          contentWarnings?: string[];
          distributionPolicy?: {
            allowArchive?: boolean;
            broadcastUntil?: string;
          };
          rights?: {
            year?: string;
            attribution?: string;
            license?: string;
            usageTerms?: string;
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
          $type: "place.stream.default.metadata",
          ...(livestreamRef && { livestreamRef }),
          createdAt: new Date().toISOString(),
          contentWarnings,
          rights,
          distributionPolicy,
        };

        const result = await bluesky.pdsAgent.com.atproto.repo.putRecord({
          repo: did,
          collection: "place.stream.default.metadata",
          rkey: "self",
          record: metadataRecord,
        });

        return {
          record: metadataRecord,
          uri: `at://${did}/place.stream.default.metadata/self`,
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
      async ({ rkey = "self" }: { rkey?: string } = {}, thunkAPI) => {
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

        const result = await bluesky.pdsAgent.com.atproto.repo.getRecord({
          repo: did,
          collection: "place.stream.default.metadata",
          rkey,
        });

        if (!result.success) {
          throw new Error("Failed to get content metadata record");
        }

        return {
          record: result.data.value,
          uri: result.data.uri,
          cid: result.data.cid,
        };
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
    selectCurrentMetadataRkey: (state) => state.currentMetadataRkey,
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
  selectCurrentMetadataRkey,
} = contentMetadataSlice.selectors;
