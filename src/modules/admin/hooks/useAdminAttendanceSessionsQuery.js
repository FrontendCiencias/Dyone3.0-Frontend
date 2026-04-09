import { useQuery } from "@tanstack/react-query";
import { getAdminAttendanceSessions } from "../services/admin.service";

export function useAdminAttendanceSessionsQuery(filters = {}, enabled = true) {
  return useQuery({
    queryKey: [
      "admin",
      "attendance-sessions",
      filters?.campusId || null,
      filters?.cycleId || null,
      filters?.status || null,
      filters?.dateFrom || null,
      filters?.dateTo || null,
      filters?.limit || 80,
    ],
    queryFn: () => getAdminAttendanceSessions(filters),
    enabled: Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
