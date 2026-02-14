import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudentWithPerson } from "../services/students.service";

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentWithPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
