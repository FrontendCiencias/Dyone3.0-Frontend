import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listEnrollments } from "../services/enrollments.service";

export function useEnrollmentsQuery(filters = {}, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["enrollments", "list", filters],
    queryFn: () => listEnrollments(filters),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
