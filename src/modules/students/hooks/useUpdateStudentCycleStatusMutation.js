import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStudentCycleStatus } from "../services/students.service";

export function useUpdateStudentCycleStatusMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateStudentCycleStatus(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
