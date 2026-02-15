import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudentFromFamily } from "../services/families.service";

export function useCreateFamilyStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentFromFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "studentsSearch"] });
    },
  });
}
