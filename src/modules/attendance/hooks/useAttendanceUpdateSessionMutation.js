import { useMutation } from "@tanstack/react-query";
import { updateAttendanceSession } from "../services/attendance.service";

export function useAttendanceUpdateSessionMutation() {
  return useMutation({
    mutationFn: updateAttendanceSession,
    retry: false,
  });
}
