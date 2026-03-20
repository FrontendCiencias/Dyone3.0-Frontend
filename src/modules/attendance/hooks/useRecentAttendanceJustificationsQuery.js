import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getRecentAttendanceJustifications } from "../services/attendance.service";

export function useRecentAttendanceJustificationsQuery({ limit = 20, enabled = true } = {}) {
  const token = getToken();

  return useQuery({
    queryKey: ["attendance", "recentJustifications", limit],
    queryFn: () => getRecentAttendanceJustifications({ limit }),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
