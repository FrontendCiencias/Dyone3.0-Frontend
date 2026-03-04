import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchUnassignedStudents } from "../services/families.service";

export function useStudentsFamilySearchQuery({ q, enabled = true, limit = 20 }) {
  const token = getToken();

  return useQuery({
    queryKey: ["families", "unassignedStudentsSearch", q || "", limit],
    queryFn: ({ signal }) => searchUnassignedStudents({ q, limit, signal }),
    enabled: Boolean(token) && Boolean(enabled) && String(q || "").trim().length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
