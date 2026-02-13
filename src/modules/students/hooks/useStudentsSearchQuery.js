import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listByCampus, searchStudents } from "../services/students.service";

export function useStudentsSearchQuery({ q, cursor, enabled, mode = "campus", campus = null }) {
  const token = getToken();

  return useQuery({
    queryKey: ["students", "search", mode, campus || null, q || "", cursor || null],
    queryFn: () => {
      if (mode === "global") {
        return searchStudents({ q, cursor });
      }
      return listByCampus({ campus, q, cursor });
    },
    enabled: Boolean(token) && Boolean(enabled) && (mode === "global" || Boolean(campus)),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
