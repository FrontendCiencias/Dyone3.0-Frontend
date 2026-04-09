import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function getCampuses() {
  const res = await axiosInstance.get(API_ROUTES.adminCampuses);
  return res.data;
}

export async function createCampus(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminCampuses, payload);
  return res.data;
}

export async function getPrograms() {
  const res = await axiosInstance.get(API_ROUTES.adminPrograms);
  return res.data;
}

export async function createProgram(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminPrograms, payload);
  return res.data;
}

export async function getProgramDetail(programId) {
  const res = await axiosInstance.get(API_ROUTES.adminProgramDetail(programId));
  return res.data;
}

export async function getProgramSessionDetail(programId, sessionId) {
  const res = await axiosInstance.get(API_ROUTES.adminProgramSessionDetail(programId, sessionId));
  return res.data;
}

export async function addProgramStudent(programId, payload) {
  const res = await axiosInstance.post(API_ROUTES.adminProgramStudents(programId), payload);
  return res.data;
}

export async function createProgramSession(programId, payload) {
  const res = await axiosInstance.post(API_ROUTES.adminProgramSessions(programId), payload);
  return res.data;
}

export async function saveProgramSessionEntry(programId, sessionId, payload) {
  const res = await axiosInstance.put(API_ROUTES.adminProgramSessionEntry(programId, sessionId), payload);
  return res.data;
}

export async function getCycles() {
  const res = await axiosInstance.get(API_ROUTES.adminCycles);
  return res.data;
}

export async function createCycle(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminCycles, payload);
  return res.data;
}

export async function getClassrooms() {
  const res = await axiosInstance.get(API_ROUTES.adminClassrooms);
  return res.data;
}

export async function createClassroom(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminClassrooms, payload);
  return res.data;
}

export async function updateClassroom(classroomId, payload) {
  const res = await axiosInstance.patch(`${API_ROUTES.adminClassrooms}/${classroomId}`, payload);
  return res.data;
}

export async function getBillingConcepts() {
  const res = await axiosInstance.get(API_ROUTES.adminBillingConcepts);
  return res.data;
}

export async function createBillingConcept(payload) {
  const res = await axiosInstance.post(API_ROUTES.adminBillingConcepts, payload);
  return res.data;
}

export async function getAdminEndpoints() {
  const response = await axiosInstance.get(API_ROUTES.adminEndpoints);
  return response.data;
}


export async function getAdminModels() {
  const response = await axiosInstance.get(API_ROUTES.adminModels);
  return response.data;
}

export async function getAttendancePolicy({ campusId, cycleId, level }) {
  const response = await axiosInstance.get(API_ROUTES.adminAttendancePolicy, {
    params: { campusId, cycleId, level },
  });
  return response.data;
}

export async function upsertAttendancePolicy(payload) {
  const response = await axiosInstance.put(API_ROUTES.adminAttendancePolicy, payload);
  return response.data;
}

export async function getAdminAttendanceSessions(params = {}) {
  const response = await axiosInstance.get(API_ROUTES.adminAttendanceSessions, { params });
  return response.data;
}

export async function deleteAdminAttendanceSession(sessionId) {
  const response = await axiosInstance.delete(API_ROUTES.adminAttendanceSessionById(sessionId));
  return response.data;
}

function parseDownloadFileName(contentDisposition) {
  const header = String(contentDisposition || "");
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = header.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || "caja-arequipa.csv";
}

async function countCsvRows(blob) {
  try {
    const text = await blob.text();
    const lines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) return 0;
    return Math.max(0, lines.length - 1);
  } catch {
    return 0;
  }
}

export async function downloadCajaArequipaExport(params = {}) {
  const response = await axiosInstance.get(API_ROUTES.adminExportCajaArequipa, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const fileName = parseDownloadFileName(response.headers?.["content-disposition"]);
  const headerRowCount = Number(response.headers?.["x-export-count"] || 0);
  const rowCount = headerRowCount > 0 ? headerRowCount : await countCsvRows(blob);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return {
    fileName,
    rowCount,
  };
}
