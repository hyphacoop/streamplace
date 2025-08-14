import { getContentMetadata } from "features/bluesky/contentMetadataSlice";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface ContentWarningsHookResult {
  warnings: string[];
  loading: boolean;
  error: string | null;
}

// Global state manager to prevent conflicts between multiple hook instances
class ContentWarningsManager {
  private static instance: ContentWarningsManager;
  private cache: Map<string, { warnings: string[]; timestamp: number }> =
    new Map();
  private subscribers: Map<string, Set<(warnings: string[]) => void>> =
    new Map();
  private pendingRequests: Map<string, Promise<void>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ContentWarningsManager {
    if (!ContentWarningsManager.instance) {
      ContentWarningsManager.instance = new ContentWarningsManager();
    }
    return ContentWarningsManager.instance;
  }

  subscribe(
    userDid: string,
    callback: (warnings: string[]) => void,
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

  private notifySubscribers(userDid: string, warnings: string[]): void {
    const userSubscribers = this.subscribers.get(userDid);
    if (userSubscribers) {
      userSubscribers.forEach((callback) => callback(warnings));
    }
  }

  async fetchWarnings(userDid: string, dispatch: any): Promise<void> {
    // Check cache first
    const cached = this.cache.get(userDid);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(
        `[ContentWarningsManager] Using cached warnings for ${userDid}:`,
        cached.warnings,
      );
      this.notifySubscribers(userDid, cached.warnings);
      return;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(userDid)) {
      console.log(
        `[ContentWarningsManager] Request already pending for ${userDid}, waiting...`,
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
      console.log(`[ContentWarningsManager] Fetching metadata for ${userDid}`);

      const result = await dispatch(getContentMetadata({ userDid })).unwrap();
      console.log(
        `[ContentWarningsManager] Metadata result for ${userDid}:`,
        result,
      );

      const contentWarnings = Array.isArray(result.record?.contentWarnings)
        ? result.record.contentWarnings
        : [];

      console.log(
        `[ContentWarningsManager] Content warnings for ${userDid}:`,
        contentWarnings,
      );

      // Cache the result
      this.cache.set(userDid, {
        warnings: contentWarnings,
        timestamp: Date.now(),
      });

      // Notify all subscribers
      this.notifySubscribers(userDid, contentWarnings);
    } catch (err: any) {
      console.log(
        `[ContentWarningsManager] Error fetching metadata for ${userDid}:`,
        err,
      );
      // Don't cache errors, but notify subscribers with empty array
      this.notifySubscribers(userDid, []);
    }
  }

  getCachedWarnings(userDid: string): string[] {
    const cached = this.cache.get(userDid);
    return cached ? cached.warnings : [];
  }
}

export function useContentWarnings(
  userDid: string | undefined,
): ContentWarningsHookResult {
  const dispatch = useAppDispatch();
  const pdsAgent = useAppSelector((state) => state.bluesky.pdsAgent);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const manager = ContentWarningsManager.getInstance();

  useEffect(() => {
    console.log(
      `[useContentWarnings] Effect running with userDid: ${userDid}, pdsAgent: ${!!pdsAgent}`,
    );

    if (!userDid) {
      console.log(`[useContentWarnings] No userDid provided, clearing state`);
      setWarnings([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Wait for PDS agent to be available
    if (!pdsAgent) {
      console.log(`[useContentWarnings] PDS agent not ready yet, waiting...`);
      return;
    }

    // Set initial state from cache
    const cachedWarnings = manager.getCachedWarnings(userDid);
    if (cachedWarnings.length > 0) {
      console.log(
        `[useContentWarnings] Setting initial state from cache for ${userDid}:`,
        cachedWarnings,
      );
      setWarnings(cachedWarnings);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }

    // Subscribe to updates
    const unsubscribe = manager.subscribe(userDid, (newWarnings) => {
      console.log(
        `[useContentWarnings] Received update for ${userDid}:`,
        newWarnings,
      );
      setWarnings(newWarnings);
      setLoading(false);
      setError(null);
    });

    unsubscribeRef.current = unsubscribe;

    // Fetch warnings
    manager.fetchWarnings(userDid, dispatch);

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userDid, pdsAgent, dispatch]);

  return { warnings, loading, error };
}
