import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStudentCharge } from "../services/students.service";

export function useUpdateStudentChargeMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chargeId, payload }) => updateStudentCharge(chargeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "accountStatement", studentId] });
    },
  });
}
