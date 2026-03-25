import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTutor } from "../services/students.service";

export function useUpdateTutorMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tutorId, payload }) => updateTutor(tutorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
    },
  });
}
