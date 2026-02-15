import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listDebtors } from "../services/payments.service";

export function usePaymentsDebtorsQuery(filters = {}, enabled = true) {
  const token = getToken();

  return useQuery({
    queryKey: ["payments", "debtors", filters],
    queryFn: () => listDebtors(filters),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
