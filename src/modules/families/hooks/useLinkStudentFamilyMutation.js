import { useMutation, useQueryClient } from "@tanstack/react-query";
import { linkStudentFamily } from "../services/families.service";

export function useLinkStudentFamilyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkStudentFamily,
    onSuccess: (_, variables) => {
      const studentId = variables?.studentId;
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      }
    },
  });
}
