import { useMutation } from "@tanstack/react-query";
import { scanAttendance } from "../services/attendance.service";

export function useAttendanceScanMutation() {
  return useMutation({
    mutationFn: scanAttendance,
    retry: false,
  });
}
