import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getActivityDetail } from "../services/activities.service";

export function useActivityDetailQuery(activityId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["activities", "detail", activityId],
    queryFn: () => getActivityDetail(activityId),
    enabled: Boolean(token) && Boolean(activityId) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
