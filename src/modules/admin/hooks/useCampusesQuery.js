import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getCampuses } from "../services/admin.service";

export function useCampusesQuery() {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "campuses"],
    queryFn: getCampuses,
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
