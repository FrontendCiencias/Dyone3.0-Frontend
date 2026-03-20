import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getAttendanceClassroomDailyReport } from "../services/attendance.service";

export function useAttendanceClassroomDailyReportQuery({ classroomId, date, enabled = true }) {
  const token = getToken();

  return useQuery({
    queryKey: ["attendance", "classroomDailyReport", classroomId || null, date || null],
    queryFn: () => getAttendanceClassroomDailyReport({ classroomId, date }),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(classroomId) && Boolean(date),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
