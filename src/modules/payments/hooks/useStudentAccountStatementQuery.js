import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getStudentAccountStatement } from "../services/payments.service";

export function useStudentAccountStatementQuery(studentId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["payments", "accountStatement", studentId],
    queryFn: () => getStudentAccountStatement(studentId),
    enabled: Boolean(token) && Boolean(enabled) && Boolean(studentId),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
