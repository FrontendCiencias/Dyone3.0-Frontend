import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEnrollmentStatus } from "../services/students.service";

export function useUpdateEnrollmentStatusMutation(studentId, enrollmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateEnrollmentStatus(enrollmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
