import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmEnrollmentCase } from "../services/enrollments.service";

export function useConfirmEnrollmentCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, payload }) => confirmEnrollmentCase(caseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "debtors"] });
    },
  });
}
