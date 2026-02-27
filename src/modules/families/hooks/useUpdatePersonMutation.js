import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePerson } from "../services/families.service";

export function useUpdatePersonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePerson,
    onSuccess: (_, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
