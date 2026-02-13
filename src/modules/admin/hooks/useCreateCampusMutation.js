import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampus } from "../services/admin.service";

export function useCreateCampusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campuses"] });
    },
  });
}
