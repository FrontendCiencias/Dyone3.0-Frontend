import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEnrollmentCaseDraft, updateEnrollmentCaseDraft } from "../services/enrollments.service";

export function useEnrollmentCaseDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, payload }) => {
      if (caseId) return updateEnrollmentCaseDraft(caseId, payload);
      return createEnrollmentCaseDraft(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
    },
  });
}
