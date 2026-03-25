import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getClassroomOptions } from "../services/students.service";

export function useClassroomOptionsQuery({ level, grade, campus, includeCapacity = true }) {
  const token = getToken();
  const hasEnoughFilters = Boolean(level) || Boolean(campus);

  return useQuery({
    queryKey: ["classroom-options", level || null, grade || null, campus || null, includeCapacity],
    queryFn: () => getClassroomOptions({ level, grade, campus, includeCapacity }),
    enabled: Boolean(token) && hasEnoughFilters,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
