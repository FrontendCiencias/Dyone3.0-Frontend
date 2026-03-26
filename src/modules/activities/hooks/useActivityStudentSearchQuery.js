import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchActivityStudents } from "../services/activities.service";

export function useActivityStudentSearchQuery(filters = {}, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["activities", "student-search", filters],
    queryFn: () => searchActivityStudents(filters),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(filters?.q),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
