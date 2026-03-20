import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getAttendanceStudentMonthlySummary } from "../services/attendance.service";

export function useAttendanceStudentMonthlySummaryQuery({ studentId, year, month, enabled = true }) {
  const token = getToken();

  return useQuery({
    queryKey: ["attendance", "studentMonthlySummary", studentId || null, year || null, month || null],
    queryFn: () => getAttendanceStudentMonthlySummary({ studentId, year, month }),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(studentId) && Boolean(year) && Boolean(month),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
