import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(endpoint, method, params) {
  console.log("[Payments][API][REQUEST]", { endpoint, method, params });
}

function logResponse(endpoint, status, dataSummary) {
  console.log("[Payments][API][RESPONSE]", { endpoint, status, dataSummary });
}

export async function listDebtors({ q = "", campus, limit = 50, cursor } = {}) {
  const params = { limit };
  if (String(q || "").trim()) params.q = String(q).trim();
  if (campus) params.campus = campus;
  if (cursor) params.cursor = cursor;

  logRequest(API_ROUTES.paymentsDebtors, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.paymentsDebtors, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  logResponse(API_ROUTES.paymentsDebtors, res.status, { count: items.length, nextCursor: res.data?.nextCursor || null });
  return res.data;
}

export async function createPayment(payload) {
  logRequest(API_ROUTES.paymentsCreate, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.paymentsCreate, payload);
  logResponse(API_ROUTES.paymentsCreate, res.status, res.data);
  return res.data;
}

export async function getStudentAccountStatement(studentId) {
  const endpoint = API_ROUTES.studentAccountStatement(studentId);
  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, {
    charges: Array.isArray(res.data?.charges) ? res.data.charges.length : 0,
    payments: Array.isArray(res.data?.payments) ? res.data.payments.length : 0,
  });
  return res.data;
}
