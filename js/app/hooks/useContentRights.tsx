import { useLivestreamStore } from "@streamplace/components";
import { useEffect, useState } from "react";

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

export function useContentRights(): ContentRightsHookResult {
  const defaultMetadata = useLivestreamStore((x) => x.defaultMetadata);
  const [contentRights, setContentRights] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract content rights from metadata
    if (defaultMetadata) {
      const rights = defaultMetadata.contentRights || {};

      setContentRights(rights);
      setLoading(false);
      setError(null);
    } else {
      // No metadata available - not loading, just empty
      setContentRights({});
      setLoading(false);
      setError(null);
    }
  }, [defaultMetadata]);

  return { contentRights, loading, error };
}
