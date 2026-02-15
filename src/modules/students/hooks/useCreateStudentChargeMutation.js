import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudentCharge } from "../services/students.service";

export function useCreateStudentChargeMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentCharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
    },
  });
}
