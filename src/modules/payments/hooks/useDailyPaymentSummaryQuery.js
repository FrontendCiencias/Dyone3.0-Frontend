import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getDailyPaymentSummary } from "../services/payments.service";

export function useDailyPaymentSummaryQuery(filters = {}, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["payments", "daily-summary", filters],
    queryFn: () => getDailyPaymentSummary(filters),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
