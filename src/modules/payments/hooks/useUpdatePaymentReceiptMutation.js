import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePaymentReceipt } from "../services/payments.service";

export function useUpdatePaymentReceiptMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, payload }) => updatePaymentReceipt(paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ["payments", "accountStatement", studentId] });
        queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
        queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      }
    },
  });
}
