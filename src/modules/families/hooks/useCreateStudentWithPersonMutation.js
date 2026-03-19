import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudentIntake } from "../services/families.service";

export function useCreateStudentWithPersonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentIntake,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "unassignedStudentsSearch"] });
    },
  });
}
