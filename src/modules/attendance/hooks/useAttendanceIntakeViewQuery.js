import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getAttendanceIntakeView } from "../services/attendance.service";

export function useAttendanceIntakeViewQuery({ sessionId, limit = 10, q = "", enabled = true, suppressNotFound = false }) {
  const token = getToken();

  return useQuery({
    queryKey: ["attendance", "intake-view", sessionId || null, limit, q || ""],
    queryFn: () => getAttendanceIntakeView({ sessionId, limit, q, suppressNotFound }),
    enabled: Boolean(token) && Boolean(sessionId) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
