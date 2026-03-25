import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClassroom } from "../services/admin.service";

export function useUpdateClassroomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classroomId, payload }) => updateClassroom(classroomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "classrooms"] });
    },
  });
}
