import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unlinkStudentFromFamily } from "../services/families.service";

export function useUnlinkStudentFromFamilyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkStudentFromFamily,
    onSuccess: (_, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
      if (variables?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["students", "summary", variables.studentId] });
      }
    },
  });
}
