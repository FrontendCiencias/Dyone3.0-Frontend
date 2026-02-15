import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPayment } from "../services/payments.service";

export function useCreatePaymentMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "debtors"] });
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
        queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
        queryClient.invalidateQueries({ queryKey: ["payments", "accountStatement", studentId] });
      }
    },
  });
}
