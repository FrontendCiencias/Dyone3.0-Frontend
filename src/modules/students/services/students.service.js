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

export async function searchStudents({ q, limit = 10, cursor = null }) {
  const params = { limit };
  if (q?.trim()) params.q = q.trim();
  if (cursor) params.cursor = cursor;

  logRequest(API_ROUTES.students, "GET", params);

  const res = await axiosInstance.get(API_ROUTES.students, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];

  logResponse(API_ROUTES.students, res.status, {
    count: items.length,
    nextCursor: res.data?.nextCursor || null,
  });

  return res.data;
}

export async function listByCampus({ campus, q = "", limit = 10, cursor = null }) {
  const endpoint = API_ROUTES.studentsByCampus(campus);
  const params = { limit };
  if (q?.trim()) params.q = q.trim();
  if (cursor) params.cursor = cursor;

  logRequest(endpoint, "GET", params);

  const res = await axiosInstance.get(endpoint, { params });
  const items = Array.isArray(res.data?.items) ? res.data.items : [];

  logResponse(endpoint, res.status, {
    count: items.length,
    nextCursor: res.data?.nextCursor || null,
  });

  return res.data;
}

export async function getStudentSummary(studentId) {
  const endpoint = API_ROUTES.studentSummary(studentId);

  logRequest(endpoint, "GET", {});

  const res = await axiosInstance.get(endpoint);

  logResponse(endpoint, res.status, res.data);

  return res.data;
}
