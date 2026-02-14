import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listAllByCampus, listByCampus, searchStudents } from "../services/students.service";

export function useStudentsSearchQuery({
  q,
  cursor,
  enabled,
  mode = "campus",
  campus = null,
  limit = 10,
}) {
  const token = getToken();

  return useQuery({
    queryKey: ["students", "search", mode, campus || null, q || "", cursor || null, limit],
    queryFn: () => {
      if (mode === "global") {
        return searchStudents({ q, cursor, limit });
      }
      if (mode === "campusFull") {
        return listAllByCampus({ campus, limit });
      }
      return listByCampus({ campus, q, cursor, limit });
    },
    enabled: Boolean(token) && Boolean(enabled) && (mode === "global" || Boolean(campus)),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
