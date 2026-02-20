import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTutor } from "../services/families.service";

export function useUpdateTutorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTutor,
    onSuccess: (_, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
