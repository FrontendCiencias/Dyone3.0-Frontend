import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeEnrollmentCaseStudent } from "../services/enrollments.service";

export function useRemoveEnrollmentCaseStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeEnrollmentCaseStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
    },
  });
}
