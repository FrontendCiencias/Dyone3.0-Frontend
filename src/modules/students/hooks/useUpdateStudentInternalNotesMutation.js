import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStudentInternalNotes } from "../services/students.service";

export function useUpdateStudentInternalNotesMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateStudentInternalNotes(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
