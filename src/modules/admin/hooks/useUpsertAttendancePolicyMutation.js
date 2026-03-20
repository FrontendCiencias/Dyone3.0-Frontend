import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertAttendancePolicy } from "../services/admin.service";

export function useUpsertAttendancePolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertAttendancePolicy,
    retry: false,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "attendance-policy", variables?.campusId || null, variables?.cycleId || null, variables?.level || null],
      });
    },
  });
}
