import { useQuery } from "@tanstack/react-query";
import { SecretaryDashboardService } from "../services/secretaryDashboard.service";

export function useSecretaryOverviewQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["dashboard", "secretary", "overview"],
    queryFn: () => SecretaryDashboardService.getOverview(),
    enabled,
    staleTime: 1000 * 30, // 30s (dashboard)
    retry: 1,
  });
}
