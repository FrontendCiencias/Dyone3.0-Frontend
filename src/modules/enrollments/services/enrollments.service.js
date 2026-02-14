import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(endpoint, method, params) {
  console.log("[StudentsPage][API][REQUEST]", {
    endpoint,
    method,
    params,
  });
}

function logResponse(endpoint, status, dataSummary) {
  console.log("[StudentsPage][API][RESPONSE]", {
    endpoint,
    status,
    dataSummary,
  });
}

export async function createQuickEnrollment(payload) {
  logRequest(API_ROUTES.enrollments, "POST", payload);

  const res = await axiosInstance.post(API_ROUTES.enrollments, payload);

  logResponse(API_ROUTES.enrollments, res.status, res.data);

  return res.data;
}
