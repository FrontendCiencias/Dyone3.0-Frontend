import { useMutation, useQueryClient } from "@tanstack/react-query";
import { justifyAttendanceRecordsBatch } from "../services/attendance.service";

export function useAttendanceBatchJustificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: justifyAttendanceRecordsBatch,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "studentMonthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "recentJustifications"] });
    },
  });
}
