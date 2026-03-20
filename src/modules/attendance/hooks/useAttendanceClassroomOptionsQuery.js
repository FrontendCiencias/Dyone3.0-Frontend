import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getAttendanceClassroomOptions } from "../services/attendance.service";

export function useAttendanceClassroomOptionsQuery(enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["attendance", "classroomOptions"],
    queryFn: getAttendanceClassroomOptions,
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
