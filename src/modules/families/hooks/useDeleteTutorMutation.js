import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTutor } from "../services/families.service";

export function useDeleteTutorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTutor,
    onSuccess: (_, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
