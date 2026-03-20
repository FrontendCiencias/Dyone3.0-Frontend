import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStudentCharge } from "../services/students.service";

export function useDeleteStudentChargeMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chargeId }) => deleteStudentCharge(chargeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "accountStatement", studentId] });
    },
  });
}
