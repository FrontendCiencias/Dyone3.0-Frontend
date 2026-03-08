import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEnrollment } from "../services/enrollments.service";

export function useCreateEnrollmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEnrollment,
    onSuccess: (_, variables) => {
      const studentId = variables?.studentId;
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      }
    },
  });
}


export const useQuickEnrollmentMutation = useCreateEnrollmentMutation;
