import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClassroom } from "../services/admin.service";

export function useCreateClassroomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "classrooms"] });
    },
  });
}
