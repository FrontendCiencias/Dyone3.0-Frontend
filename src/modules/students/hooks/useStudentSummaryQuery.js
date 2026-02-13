import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getStudentSummary } from "../services/students.service";

export function useStudentSummaryQuery(studentId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["students", "summary", studentId],
    queryFn: () => getStudentSummary(studentId),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(studentId),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
