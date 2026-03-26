import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createActivityCollection } from "../services/activities.service";

export function useCreateActivityCollectionMutation(activityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createActivityCollection(activityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "detail", activityId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
