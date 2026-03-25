import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStudent } from "../services/students.service";

export function useDeleteStudentMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteStudent(studentId),
    onSuccess: () => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("dyone.deletedStudentId", String(studentId));
      }
      queryClient.cancelQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.cancelQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.cancelQueries({ queryKey: ["students", "deletion-preview", studentId] });
      queryClient.cancelQueries({ queryKey: ["payments", "accountStatement", studentId] });
      queryClient.removeQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.removeQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.removeQueries({ queryKey: ["students", "deletion-preview", studentId] });
      queryClient.removeQueries({ queryKey: ["payments", "accountStatement", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
