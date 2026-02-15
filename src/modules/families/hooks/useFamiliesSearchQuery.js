import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchFamilies } from "../services/families.service";

export function useFamiliesSearchQuery({ q, enabled = true, limit = 20 }) {
  const token = getToken();
  const normalizedQuery = String(q || "").trim();

  return useQuery({
    queryKey: ["families", "search", normalizedQuery, limit],
    queryFn: () => searchFamilies({ q: normalizedQuery, limit }),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
