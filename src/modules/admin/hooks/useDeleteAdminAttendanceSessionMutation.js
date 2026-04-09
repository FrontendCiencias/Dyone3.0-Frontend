import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAdminAttendanceSession } from "../services/admin.service";

export function useDeleteAdminAttendanceSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminAttendanceSession,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "attendance-sessions"] });
    },
  });
}
