import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchStudentsForFamily } from "../services/families.service";

export function useStudentsFamilySearchQuery({ q, enabled = true }) {
  const token = getToken();

  return useQuery({
    queryKey: ["families", "studentsSearch", q || ""],
    queryFn: () => searchStudentsForFamily({ q }),
    enabled: Boolean(token) && Boolean(enabled) && String(q || "").trim().length >= 2,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
