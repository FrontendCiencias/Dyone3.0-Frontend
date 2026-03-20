import { useMutation } from "@tanstack/react-query";
import { openAttendanceSession } from "../services/attendance.service";

export function useAttendanceOpenSessionMutation() {
  return useMutation({
    mutationFn: openAttendanceSession,
    retry: false,
  });
}
