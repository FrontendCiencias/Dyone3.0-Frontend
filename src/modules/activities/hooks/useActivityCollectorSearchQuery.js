import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchActivityCollectors } from "../services/activities.service";

export function useActivityCollectorSearchQuery(params, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["activities", "collectors-search", params],
    queryFn: () => searchActivityCollectors(params),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
