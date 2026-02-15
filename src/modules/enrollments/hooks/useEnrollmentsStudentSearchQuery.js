import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchStudentsForEnrollments } from "../services/enrollments.service";

export function useEnrollmentsStudentSearchQuery({ q, enabled = true, limit = 20 }) {
  const token = getToken();
  const normalizedQuery = String(q || "").trim();

  return useQuery({
    queryKey: ["enrollments", "studentsSearch", normalizedQuery, limit],
    queryFn: () => searchStudentsForEnrollments({ q: normalizedQuery, limit }),
    enabled: Boolean(token) && Boolean(enabled) && normalizedQuery.length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
