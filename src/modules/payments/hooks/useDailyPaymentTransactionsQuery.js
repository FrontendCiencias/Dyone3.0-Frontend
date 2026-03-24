import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getDailyPaymentTransactions } from "../services/payments.service";

export function useDailyPaymentTransactionsQuery(filters = {}, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["payments", "daily-transactions", filters],
    queryFn: () => getDailyPaymentTransactions(filters),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
