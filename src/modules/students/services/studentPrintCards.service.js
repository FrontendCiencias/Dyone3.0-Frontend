import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

function logRequest(payload) {
  console.log("[StudentPrintCards][API][REQUEST]", {
    endpoint: API_ROUTES.studentsPrintCards,
    method: "POST",
    payload,
  });
}

function logResponse(status, items) {
  console.log("[StudentPrintCards][API][RESPONSE]", {
    endpoint: API_ROUTES.studentsPrintCards,
    status,
    count: items.length,
    firstItem: items[0] || null,
  });
}

export async function fetchStudentsForPrintCards(payload) {
  const body = {
    studentIds: Array.isArray(payload?.studentIds) ? payload.studentIds : [],
    filters: payload?.filters || {},
  };

  logRequest(body);

  const res = await axiosInstance.post(API_ROUTES.studentsPrintCards, body);
  const items = Array.isArray(res.data?.items) ? res.data.items : [];

  logResponse(res.status, items);

  return {
    ...res.data,
    items,
  };
}
