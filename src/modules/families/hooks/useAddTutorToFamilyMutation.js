import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTutorToFamily } from "../services/families.service";

export function useAddTutorToFamilyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTutorToFamily,
    onSuccess: (_, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
