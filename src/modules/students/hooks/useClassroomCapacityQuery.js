import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getClassroomCapacity } from "../services/students.service";

export function useClassroomCapacityQuery(classroomId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["enrollments", "classroomCapacity", classroomId],
    queryFn: () => getClassroomCapacity(classroomId),
    enabled: Boolean(token) && Boolean(classroomId) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
