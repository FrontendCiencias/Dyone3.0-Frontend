import { useInfiniteQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listFamilies } from "../services/families.service";

export function useFamiliesListQuery({ enabled = true, limit = 12 }) {
  const token = getToken();

  return useInfiniteQuery({
    queryKey: ["families", "list", limit],
    queryFn: ({ pageParam }) => listFamilies({ limit, cursor: pageParam || null }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
    initialPageParam: null,
  });
}
