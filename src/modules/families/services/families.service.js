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

export async function linkStudentFamily(payload) {
  logRequest(API_ROUTES.familiesLinkStudent, "POST", payload);

  const res = await axiosInstance.post(API_ROUTES.familiesLinkStudent, payload);

  logResponse(API_ROUTES.familiesLinkStudent, res.status, res.data);

  return res.data;
}
