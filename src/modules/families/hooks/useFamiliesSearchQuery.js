import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchFamilies } from "../services/families.service";

export function useFamiliesSearchQuery({ q, enabled = true, limit = 20 }) {
  const token = getToken();

  return useQuery({
    queryKey: ["families", "search", q || "", limit],
    queryFn: () => searchFamilies({ q, limit }),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
