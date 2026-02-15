import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getAdminModels } from "../services/admin.service";

export function useAdminModelsQuery(enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "models"],
    queryFn: getAdminModels,
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
