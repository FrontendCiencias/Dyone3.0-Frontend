import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuickEnrollment } from "../services/enrollments.service";

export function useQuickEnrollmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuickEnrollment,
    onSuccess: (_, variables) => {
      const studentId = variables?.studentId;
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      }
    },
  });
}
