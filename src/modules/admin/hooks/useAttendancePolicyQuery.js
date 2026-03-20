import { useQuery } from "@tanstack/react-query";
import { getAttendancePolicy } from "../services/admin.service";

export function useAttendancePolicyQuery({ campusId, cycleId, level, enabled = true }) {
  return useQuery({
    queryKey: ["admin", "attendance-policy", campusId || null, cycleId || null, level || null],
    queryFn: () => getAttendancePolicy({ campusId, cycleId, level }),
    enabled: Boolean(enabled) && Boolean(campusId) && Boolean(cycleId) && Boolean(level),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
