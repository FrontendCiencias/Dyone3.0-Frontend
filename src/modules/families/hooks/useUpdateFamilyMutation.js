import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFamily } from "../services/families.service";

export function useUpdateFamilyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFamily,
    onSuccess: (_, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
      queryClient.invalidateQueries({ queryKey: ["families", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "list"] });
    },
  });
}
