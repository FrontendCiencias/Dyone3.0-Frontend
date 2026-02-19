import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStudentIdentity } from "../services/students.service";

export function useUpdateStudentIdentityMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateStudentIdentity(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
