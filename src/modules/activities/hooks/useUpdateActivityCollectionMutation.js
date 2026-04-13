import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityCollection } from "../services/activities.service";

export function useUpdateActivityCollectionMutation(activityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, payload }) => updateActivityCollection(collectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "detail", activityId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
