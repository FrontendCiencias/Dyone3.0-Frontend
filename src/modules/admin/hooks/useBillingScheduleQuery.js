import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getBillingSchedule } from "../services/adminBillingSchedule.service";

export function useBillingScheduleQuery(cycleId) {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "billingSchedule", cycleId],
    queryFn: () => getBillingSchedule(cycleId),
    enabled: Boolean(token && cycleId),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
