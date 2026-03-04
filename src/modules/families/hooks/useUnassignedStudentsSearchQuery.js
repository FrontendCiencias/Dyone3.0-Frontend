import { useStudentsFamilySearchQuery } from "./useStudentsFamilySearchQuery";

export function useUnassignedStudentsSearchQuery(q, limit = 20, enabled = true) {
  return useStudentsFamilySearchQuery({ q, limit, enabled });
}
