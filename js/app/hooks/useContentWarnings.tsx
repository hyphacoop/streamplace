import { useLivestreamStore } from "@streamplace/components";
import { useEffect, useState } from "react";

interface ContentWarningsHookResult {
  warnings: string[];
  loading: boolean;
  error: string | null;
}

export function useContentWarnings(): ContentWarningsHookResult {
  const defaultMetadata = useLivestreamStore((x) => x.defaultMetadata);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract content warnings from metadata
    if (defaultMetadata) {
      const contentWarnings = Array.isArray(defaultMetadata.contentWarnings)
        ? defaultMetadata.contentWarnings
        : [];

      setWarnings(contentWarnings);
      setLoading(false);
      setError(null);
    } else {
      // No metadata available - not loading, just empty
      setWarnings([]);
      setLoading(false);
      setError(null);
    }
  }, [defaultMetadata]);

  return { warnings, loading, error };
}
