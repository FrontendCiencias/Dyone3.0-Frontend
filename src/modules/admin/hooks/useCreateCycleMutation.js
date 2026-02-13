import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCycle } from "../services/admin.service";

export function useCreateCycleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cycles"] });
    },
  });
}
