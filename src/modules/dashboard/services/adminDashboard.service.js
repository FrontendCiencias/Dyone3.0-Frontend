import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(params) {
  console.log("[Dashboard][Admin][API][REQUEST]", {
    endpoint: API_ROUTES.dashboardAdminOverview,
    method: "GET",
    params,
  });
}

function logResponse(status, data) {
  console.log("[Dashboard][Admin][API][RESPONSE]", {
    endpoint: API_ROUTES.dashboardAdminOverview,
    status,
    dataSummary: {
      activeStudents: data?.summary?.activeStudents || 0,
      alerts: data?.alerts || {},
      recentActivity: Array.isArray(data?.recentActivity) ? data.recentActivity.length : 0,
    },
  });
}

async function getOverview({ campus } = {}) {
  const params = {};
  if (campus) params.campus = campus;

  logRequest(params);
  const { data, status } = await axiosInstance.get(API_ROUTES.dashboardAdminOverview, { params });
  logResponse(status, data);
  return data;
}

export const AdminDashboardService = { getOverview };
