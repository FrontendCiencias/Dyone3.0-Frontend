import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createActivity } from "../services/activities.service";

export function useCreateActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
