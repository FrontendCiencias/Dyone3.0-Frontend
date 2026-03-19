import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(params) {
  console.log("[Dashboard][API][REQUEST]", {
    endpoint: API_ROUTES.dashboardSecretaryOverview,
    method: "GET",
    params,
  });
}

function logResponse(status, data) {
  console.log("[Dashboard][API][RESPONSE]", {
    endpoint: API_ROUTES.dashboardSecretaryOverview,
    status,
    dataSummary: {
      activeStudents: data?.summary?.activeStudents || 0,
      openIssues: data?.summary?.openIssues || 0,
      recentActivity: Array.isArray(data?.recentActivity) ? data.recentActivity.length : 0,
    },
  });
}

async function getOverview({ campus } = {}) {
  const params = {};
  if (campus) params.campus = campus;

  logRequest(params);
  const { data, status } = await axiosInstance.get(API_ROUTES.dashboardSecretaryOverview, { params });
  logResponse(status, data);
  return data;
}

export const SecretaryDashboardService = { getOverview };
