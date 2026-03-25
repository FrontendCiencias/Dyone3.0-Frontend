import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePaymentReceipt } from "../services/payments.service";

export function useUpdatePaymentReceiptMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, payload }) => updatePaymentReceipt(paymentId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      const affectedStudentIds = Array.isArray(data?.affectedStudentIds) && data.affectedStudentIds.length
        ? data.affectedStudentIds
        : (studentId ? [studentId] : []);

      for (const affectedStudentId of affectedStudentIds) {
        queryClient.invalidateQueries({ queryKey: ["payments", "accountStatement", affectedStudentId] });
        queryClient.invalidateQueries({ queryKey: ["students", "summary", affectedStudentId] });
        queryClient.invalidateQueries({ queryKey: ["students", "detail", affectedStudentId] });
      }
    },
  });
}
