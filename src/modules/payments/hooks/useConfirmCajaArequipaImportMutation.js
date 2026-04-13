import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmCajaArequipaImport } from "../services/payments.service";

export function useConfirmCajaArequipaImportMutation(importId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => confirmCajaArequipaImport(importId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (importId) {
        queryClient.invalidateQueries({ queryKey: ["payments", "caja-arequipa", "review", importId] });
      }
    },
  });
}
