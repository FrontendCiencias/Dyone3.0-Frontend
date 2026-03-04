import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudentWithPerson } from "../services/families.service";

export function useCreateStudentWithPersonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentWithPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "unassignedStudentsSearch"] });
    },
  });
}
