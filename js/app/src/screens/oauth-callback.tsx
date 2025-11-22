import { storage } from "@streamplace/components";
import { Redirect } from "components/aqlink";
import Loading from "components/loading/loading";
import { useEffect, useState } from "react";

export default function OAuthCallback() {
  const [returnRoute, setReturnRoute] = useState<{
    name: string;
    params?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getItem("returnRoute").then((stored) => {
      if (stored) {
        try {
          const route = JSON.parse(stored);
          console.log("OAuthCallback - redirecting to stored route:", route);
          setReturnRoute(route);
          // clear the stored route
          storage.removeItem("returnRoute");
        } catch (e) {
          console.error("Failed to parse returnRoute from storage", e);
          setLoading(false);
        }
      } else {
        console.log("OAuthCallback - no return route stored, staying here");
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (returnRoute) {
    return <Redirect to={returnRoute as any} />;
  }

  // no return route, just show success message
  return <Loading />;
}
