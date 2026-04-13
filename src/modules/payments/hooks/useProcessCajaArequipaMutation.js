import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processCajaArequipaPdf } from "../services/payments.service";

export function useProcessCajaArequipaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processCajaArequipaPdf,
    onSuccess: (data) => {
      if (data?.importId) {
        queryClient.invalidateQueries({ queryKey: ["payments", "caja-arequipa", "review", data.importId] });
      }
    },
  });
}
