import { useMutation, useQueryClient } from "@tanstack/react-query";
import { linkStudentFamily } from "../services/families.service";

export function useLinkStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkStudentFamily,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["families", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "studentsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      if (variables?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["students", "summary", variables.studentId] });
      }
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ["families", "detail", variables.familyId] });
      }
    },
  });
}
