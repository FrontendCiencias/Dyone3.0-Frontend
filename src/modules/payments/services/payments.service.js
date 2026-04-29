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

export async function fetchDebtorsForPrint(payload) {
  const body = {
    studentIds: Array.isArray(payload?.studentIds) ? payload.studentIds : [],
    filters: payload?.filters || {},
  };

  logRequest(API_ROUTES.paymentsDebtorsPrint, "POST", body);
  const res = await axiosInstance.post(API_ROUTES.paymentsDebtorsPrint, body);
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  logResponse(API_ROUTES.paymentsDebtorsPrint, res.status, { count: items.length });
  return {
    ...res.data,
    items,
  };
}

export async function createPayment(payload) {
  logRequest(API_ROUTES.paymentsCreate, "POST", payload);
  const res = await axiosInstance.post(API_ROUTES.paymentsCreate, payload);
  logResponse(API_ROUTES.paymentsCreate, res.status, res.data);
  return res.data;
}

export async function getAccountingPayments({ campus, method, page = 1, limit = 25 } = {}) {
  const params = { page, limit };
  if (campus) params.campus = campus;
  if (method) params.method = method;

  logRequest(API_ROUTES.paymentsAccounting, "GET", params);
  const res = await axiosInstance.get(API_ROUTES.paymentsAccounting, { params });
  logResponse(API_ROUTES.paymentsAccounting, res.status, {
    count: Array.isArray(res.data?.items) ? res.data.items.length : 0,
    page: res.data?.pageInfo?.page || 1,
    hasNext: Boolean(res.data?.pageInfo?.hasNext),
  });
  return res.data;
}

export async function getRegisteredPayments({ campus, method, page = 1, limit = 25 } = {}) {
  return getAccountingPayments({ campus, method, page, limit });
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

export async function processCajaArequipaPdf(payload) {
  logRequest(API_ROUTES.paymentsCajaArequipaProcess, "POST", {
    campus: payload?.campus,
    fileName: payload?.fileName,
    pdfBase64Length: payload?.pdfBase64?.length || 0,
  });
  const res = await axiosInstance.post(API_ROUTES.paymentsCajaArequipaProcess, payload);
  logResponse(API_ROUTES.paymentsCajaArequipaProcess, res.status, res.data);
  return res.data;
}

export async function getCajaArequipaReview(importId) {
  const endpoint = API_ROUTES.paymentsCajaArequipaReview(importId);
  logRequest(endpoint, "GET", {});
  const res = await axiosInstance.get(endpoint);
  logResponse(endpoint, res.status, {
    status: res.data?.status,
    processedRows: res.data?.summary?.processedRows || 0,
  });
  return res.data;
}

export async function confirmCajaArequipaImport(importId) {
  logRequest(API_ROUTES.paymentsCajaArequipaConfirm, "POST", { importId });
  const res = await axiosInstance.post(API_ROUTES.paymentsCajaArequipaConfirm, { importId });
  logResponse(API_ROUTES.paymentsCajaArequipaConfirm, res.status, res.data);
  return res.data;
}
