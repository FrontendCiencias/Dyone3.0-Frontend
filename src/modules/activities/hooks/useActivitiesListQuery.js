import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listActivities } from "../services/activities.service";

export function useActivitiesListQuery(filters = {}, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["activities", "list", filters],
    queryFn: () => listActivities(filters),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
