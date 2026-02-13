import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBillingConcept } from "../services/admin.service";

export function useCreateBillingConceptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBillingConcept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billingConcepts"] });
    },
  });
}
