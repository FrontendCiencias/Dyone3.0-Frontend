import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { listDebtors, searchDebtors } from "../services/payments.service";

export function usePaymentsDebtorsQuery(filters = {}, enabled = true, mode = "list") {
  const token = getToken();

  return useQuery({
    queryKey: ["payments", "debtors", mode, filters],
    queryFn: () => (mode === "search" ? searchDebtors(filters) : listDebtors(filters)),
    enabled: Boolean(token) && Boolean(enabled),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
