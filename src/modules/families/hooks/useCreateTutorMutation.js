import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTutor } from "../services/families.service";

export function useCreateTutorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTutor,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["families", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "studentsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
