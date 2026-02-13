import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getCycles } from "../services/admin.service";

export function useCyclesQuery() {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "cycles"],
    queryFn: getCycles,
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
