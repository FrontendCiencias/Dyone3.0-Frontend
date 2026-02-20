import { useInfiniteQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { searchFamilies } from "../services/families.service";

export function useFamiliesSearchInfiniteQuery({ q, enabled = true, limit = 12 }) {
  const token = getToken();
  const normalizedQuery = String(q || "").trim();

  return useInfiniteQuery({
    queryKey: ["families", "search", normalizedQuery, limit],
    queryFn: ({ pageParam }) => searchFamilies({ q: normalizedQuery, limit, cursor: pageParam || null }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
    initialPageParam: null,
  });
}
