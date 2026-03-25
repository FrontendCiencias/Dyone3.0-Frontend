import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getStudentDeletionPreview } from "../services/students.service";

export function useStudentDeletionPreviewQuery(studentId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["students", "deletion-preview", studentId],
    queryFn: () => getStudentDeletionPreview(studentId),
    enabled: Boolean(token) && Boolean(studentId) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
