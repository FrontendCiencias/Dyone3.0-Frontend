import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchTutors } from "../services/students.service";

export function useTutorSearchQuery(query, enabled = true) {
  const token = getToken();
  const normalizedQuery = String(query || "").trim();

  return useQuery({
    queryKey: ["students", "tutors", "search", normalizedQuery],
    queryFn: () => searchTutors({ q: normalizedQuery, limit: 8 }),
    enabled: Boolean(token) && enabled && normalizedQuery.length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
