import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getStudentDetail } from "../services/students.service";

export function useStudentDetailQuery(studentId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["students", "detail", studentId],
    queryFn: () => getStudentDetail(studentId),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(studentId),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
