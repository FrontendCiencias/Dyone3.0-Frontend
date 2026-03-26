import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivity } from "../services/activities.service";

export function useUpdateActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, payload }) => updateActivity(activityId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities", "detail", variables?.activityId] });
    },
  });
}
