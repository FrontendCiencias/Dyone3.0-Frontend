import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeStudentClassroom } from "../services/students.service";

export function useChangeStudentClassroomMutation(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => changeStudentClassroom(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "summary", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments", "list"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-options"] });
    },
  });
}
