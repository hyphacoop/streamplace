import { getContentMetadata } from "features/bluesky/contentMetadataSlice";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface ContentRightsHookResult {
  contentRights: {
    creator?: string;
    copyrightNotice?: string;
    copyrightYear?: string | number;
    license?: string;
    creditLine?: string;
  };
  loading: boolean;
  error: string | null;
}

// Reuse the same ContentWarningsManager class but adapt it for content rights
class ContentRightsManager {
  private static instance: ContentRightsManager;
  private cache: Map<string, { contentRights: any; timestamp: number }> =
    new Map();
  private subscribers: Map<string, Set<(contentRights: any) => void>> =
    new Map();
  private pendingRequests: Map<string, Promise<void>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ContentRightsManager {
    if (!ContentRightsManager.instance) {
      ContentRightsManager.instance = new ContentRightsManager();
    }
    return ContentRightsManager.instance;
  }

  subscribe(
    userDid: string,
    callback: (contentRights: any) => void,
  ): () => void {
    if (!this.subscribers.has(userDid)) {
      this.subscribers.set(userDid, new Set());
    }

    const userSubscribers = this.subscribers.get(userDid)!;
    userSubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      userSubscribers.delete(callback);
      if (userSubscribers.size === 0) {
        this.subscribers.delete(userDid);
      }
    };
  }

  private notifySubscribers(userDid: string, contentRights: any): void {
    const userSubscribers = this.subscribers.get(userDid);
    if (userSubscribers) {
      userSubscribers.forEach((callback) => callback(contentRights));
    }
  }

  async fetchContentRights(userDid: string, dispatch: any): Promise<void> {
    // Check cache first
    const cached = this.cache.get(userDid);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(
        `[ContentRightsManager] Using cached rights for ${userDid}:`,
        cached.contentRights,
      );
      this.notifySubscribers(userDid, cached.contentRights);
      return;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(userDid)) {
      console.log(
        `[ContentRightsManager] Request already pending for ${userDid}, waiting...`,
      );
      await this.pendingRequests.get(userDid);
      return;
    }

    // Create new request
    const requestPromise = this.performFetch(userDid, dispatch);
    this.pendingRequests.set(userDid, requestPromise);

    try {
      await requestPromise;
    } finally {
      this.pendingRequests.delete(userDid);
    }
  }

  private async performFetch(userDid: string, dispatch: any): Promise<void> {
    try {
      const result = await dispatch(getContentMetadata({ userDid })).unwrap();

      const contentRights = result.record?.contentRights || {};

      // Cache the result
      this.cache.set(userDid, {
        contentRights,
        timestamp: Date.now(),
      });

      // Notify all subscribers
      this.notifySubscribers(userDid, contentRights);
    } catch (err: any) {
      console.log(
        `[ContentRightsManager] Error fetching metadata for ${userDid}:`,
        err,
      );
      // Don't cache errors, but notify subscribers with empty object
      this.notifySubscribers(userDid, {});
    }
  }

  getCachedContentRights(userDid: string): any {
    const cached = this.cache.get(userDid);
    return cached ? cached.contentRights : {};
  }
}

export function useContentRights(
  userDid: string | undefined,
): ContentRightsHookResult {
  const dispatch = useAppDispatch();
  const pdsAgent = useAppSelector((state) => state.bluesky.pdsAgent);
  const [contentRights, setContentRights] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const manager = ContentRightsManager.getInstance();

  useEffect(() => {
    if (!userDid) {
      setContentRights({});
      setLoading(false);
      setError(null);
      return;
    }

    // Wait for PDS agent to be available
    if (!pdsAgent) {
      console.log(`[useContentRights] PDS agent not ready yet, waiting...`);
      return;
    }

    // Set initial state from cache
    const cachedRights = manager.getCachedContentRights(userDid);
    if (cachedRights && Object.keys(cachedRights).length > 0) {
      console.log(
        `[useContentRights] Setting initial state from cache for ${userDid}:`,
        cachedRights,
      );
      setContentRights(cachedRights);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }

    // Subscribe to updates
    const unsubscribe = manager.subscribe(userDid, (newRights) => {
      console.log(
        `[useContentRights] Received update for ${userDid}:`,
        newRights,
      );
      setContentRights(newRights);
      setLoading(false);
      setError(null);
    });

    unsubscribeRef.current = unsubscribe;

    // Fetch content rights
    manager.fetchContentRights(userDid, dispatch);

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userDid, pdsAgent, dispatch]);

  return { contentRights, loading, error };
}
