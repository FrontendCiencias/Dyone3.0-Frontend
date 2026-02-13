import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getBillingConcepts } from "../services/admin.service";

export function useBillingConceptsQuery() {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "billingConcepts"],
    queryFn: getBillingConcepts,
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
