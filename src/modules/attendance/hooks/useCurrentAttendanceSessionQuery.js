import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getCurrentAttendanceSession } from "../services/attendance.service";

export function useCurrentAttendanceSessionQuery({ campusId, cycleId, date, enabled = true }) {
  const token = getToken();

  return useQuery({
    queryKey: ["attendance", "current-session", campusId || null, cycleId || null, date || null],
    queryFn: () => getCurrentAttendanceSession({ campusId, cycleId, date }),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(campusId) && Boolean(cycleId) && Boolean(date),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
