import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getCajaArequipaReview } from "../services/payments.service";

export function useCajaArequipaReviewQuery(importId, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["payments", "caja-arequipa", "review", importId],
    queryFn: () => getCajaArequipaReview(importId),
    enabled: Boolean(token) && Boolean(importId) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
