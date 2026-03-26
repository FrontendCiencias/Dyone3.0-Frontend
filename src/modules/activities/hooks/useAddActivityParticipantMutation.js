import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addActivityParticipant } from "../services/activities.service";

export function useAddActivityParticipantMutation(activityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => addActivityParticipant(activityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "detail", activityId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
