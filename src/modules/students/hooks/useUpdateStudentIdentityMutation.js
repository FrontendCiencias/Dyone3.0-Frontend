import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStudentIdentity } from "../services/students.service";

export function useUpdateStudentIdentityMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateStudentIdentity(studentId, payload),
    onSuccess: (data) => {
      const summary = data?.summary || null;

      if (summary) {
        queryClient.setQueryData(["students", "summary", studentId], summary);
        queryClient.setQueryData(["students", "detail", studentId], summary);
        queryClient.setQueryData(["student-summary", studentId], summary);
        queryClient.setQueryData(["student-detail", studentId], summary);
      }

      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
