import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchStudents } from "../services/students.service";

export function useStudentsSearchQuery({ q, cursor, enabled }) {
  const token = getToken();

  return useQuery({
    queryKey: ["students", "search", q, cursor || null],
    queryFn: () => searchStudents({ q, cursor }),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(q?.trim()),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
