import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchFamilies } from "../services/families.service";

export function useFamiliesSearchQuery({ q, enabled = true, limit = 20 }) {
  const token = getToken();
  const normalizedQuery = String(q || "").trim();
  const hasSearchTerm = normalizedQuery.length >= 2;

  return useQuery({
    queryKey: ["families", "search", normalizedQuery, limit],
    queryFn: () => searchFamilies({ q: normalizedQuery, limit }),
    enabled: Boolean(token) && Boolean(enabled) && hasSearchTerm,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
