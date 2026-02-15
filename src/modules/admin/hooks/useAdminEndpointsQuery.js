import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getAdminEndpoints } from "../services/admin.service";

export function useAdminEndpointsQuery(enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "endpoints"],
    queryFn: getAdminEndpoints,
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
