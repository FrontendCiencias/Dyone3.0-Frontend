import { useQuery } from "@tanstack/react-query";
import { AdminDashboardService } from "../services/adminDashboard.service";

export function useAdminOverviewQuery({ enabled = true, campus } = {}) {
  return useQuery({
    queryKey: ["dashboard", "admin", "overview", campus || "ALL"],
    queryFn: () => AdminDashboardService.getOverview({ campus }),
    enabled,
    staleTime: 1000 * 30,
    retry: 1,
  });
}
