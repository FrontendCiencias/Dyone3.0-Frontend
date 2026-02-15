import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmEnrollment, createEnrollment } from "../services/students.service";

export function useConfirmEnrollmentMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrollmentId, payload }) => {
      let nextEnrollmentId = enrollmentId;

      if (!nextEnrollmentId) {
        const created = await createEnrollment(payload);
        nextEnrollmentId = created?.id || created?.enrollment?.id;
      }

      if (!nextEnrollmentId) {
        throw new Error("No se pudo determinar la matrícula a confirmar.");
      }

      return confirmEnrollment(nextEnrollmentId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
