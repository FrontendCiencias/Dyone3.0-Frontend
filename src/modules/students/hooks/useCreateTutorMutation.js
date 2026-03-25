import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTutor } from "../services/students.service";

export function useCreateTutorMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTutor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
    },
  });
}
