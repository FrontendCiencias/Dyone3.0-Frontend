import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFamily } from "../services/families.service";

export function useCreateFamilyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families", "search"] });
    },
  });
}
