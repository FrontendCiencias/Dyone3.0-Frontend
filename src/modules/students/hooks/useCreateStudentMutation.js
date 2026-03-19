import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudentIntake } from "../services/students.service";

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentIntake,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
