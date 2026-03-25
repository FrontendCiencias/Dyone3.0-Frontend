import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTutor } from "../services/students.service";

export function useDeleteTutorMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tutorId) => deleteTutor(tutorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
    },
  });
}
