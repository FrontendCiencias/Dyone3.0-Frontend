import { useQuery } from "@tanstack/react-query";
import { SecretaryDashboardService } from "../services/secretaryDashboard.service";

export function useSecretaryOverviewQuery({ enabled = true, campus } = {}) {
  return useQuery({
    queryKey: ["dashboard", "secretary", "overview", campus || "ALL"],
    queryFn: () => SecretaryDashboardService.getOverview({ campus }),
    enabled,
    staleTime: 1000 * 30, // 30s (dashboard)
    retry: 1,
  });
}
