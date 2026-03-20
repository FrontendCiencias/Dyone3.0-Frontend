import { useMutation } from "@tanstack/react-query";
import { justifyAttendanceRecord } from "../services/attendance.service";

export function useAttendanceJustifyMutation() {
  return useMutation({
    mutationFn: justifyAttendanceRecord,
    retry: false,
  });
}
