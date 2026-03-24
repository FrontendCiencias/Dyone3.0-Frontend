import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(endpoint, method, params) {
  console.log("[Payments][API][REQUEST]", { endpoint, method, params });
}

function logResponse(endpoint, status, dataSummary) {
  console.log("[Payments][API][RESPONSE]", { endpoint, status, dataSummary });
}

export async function listDebtors({ campus, limit = 50, cursor, onlyOverdue = false } = {}) {
  const params = { limit };
  if (campus) params.campus = campus;
  if (cursor) params.page = cursor;
  if (onlyOverdue) params.onlyOverdue = true;

  logRequest(API_ROUTES.paymentsDebtors, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.paymentsDebtors, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  logResponse(API_ROUTES.paymentsDebtors, res.status, {
    count: items.length,
    page: res.data?.pageInfo?.page || 1,
    hasNext: Boolean(res.data?.pageInfo?.hasNext),
  });
  return res.data;
}

export async function searchDebtors({ q, campus, limit = 15 } = {}) {
  const params = { q, limit };
  if (campus) params.campus = campus;

  logRequest(API_ROUTES.paymentsDebtorsSearch, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.paymentsDebtorsSearch, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  logResponse(API_ROUTES.paymentsDebtorsSearch, res.status, { count: items.length });
  return res.data;
}

export async function createPayment(payload) {
  logRequest(API_ROUTES.paymentsCreate, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.paymentsCreate, payload);
  logResponse(API_ROUTES.paymentsCreate, res.status, res.data);
  return res.data;
}

export async function updatePaymentReceipt(paymentId, payload) {
  const endpoint = API_ROUTES.paymentReceiptCorrection(paymentId);
  logRequest(endpoint, "PATCH", payload);
  const res = await axiosInstance.patch(endpoint, payload);
  logResponse(endpoint, res.status, res.data);
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

export async function getDailyPaymentSummary({ date, campus } = {}) {
  const params = {};
  if (date) params.date = date;
  if (campus) params.campus = campus;

  logRequest(API_ROUTES.paymentsDailySummary, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.paymentsDailySummary, { params });
  logResponse(API_ROUTES.paymentsDailySummary, res.status, {
    date: res.data?.date,
    totalIncome: res.data?.totalIncome || 0,
    paymentsCount: res.data?.paymentsCount || 0,
  });
  return res.data;
}

export async function getDailyPaymentTransactions({ date, campus, page = 1, limit = 20 } = {}) {
  const params = { page, limit };
  if (date) params.date = date;
  if (campus) params.campus = campus;

  logRequest(API_ROUTES.paymentsDailyTransactions, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.paymentsDailyTransactions, { params });
  logResponse(API_ROUTES.paymentsDailyTransactions, res.status, {
    date: res.data?.date,
    count: Array.isArray(res.data?.items) ? res.data.items.length : 0,
    page: res.data?.pageInfo?.page || 1,
    hasNext: Boolean(res.data?.pageInfo?.hasNext),
  });
  return res.data;
}
