import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFamilyPrimaryTutor } from "../services/families.service";

export function useUpdateFamilyPrimaryTutorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFamilyPrimaryTutor,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["families", "search"] });
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
