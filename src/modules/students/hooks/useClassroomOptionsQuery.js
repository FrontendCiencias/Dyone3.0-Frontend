import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getClassroomOptions } from "../services/students.service";

export function useClassroomOptionsQuery({ level, grade, includeCapacity = true }) {
  const token = getToken();

  return useQuery({
    queryKey: ["classroom-options", level, grade, includeCapacity],
    queryFn: () => getClassroomOptions({ level, grade, includeCapacity }),
    enabled: Boolean(token) && Boolean(level) && Boolean(grade),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
