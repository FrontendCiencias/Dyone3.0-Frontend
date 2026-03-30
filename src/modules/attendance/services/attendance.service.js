import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function openAttendanceSession(payload) {
  const response = await axiosInstance.post(API_ROUTES.attendanceOpenSession, payload);
  return response.data;
}

export async function getCurrentAttendanceSession({ campusId, cycleId, date }) {
  const response = await axiosInstance.get(API_ROUTES.attendanceCurrentSession, {
    params: { campusId, cycleId, date },
  });
  return response.data;
}

export async function getAttendanceIntakeView({ sessionId, limit = 10, q = "", suppressNotFound = false }) {
  try {
    const response = await axiosInstance.get(API_ROUTES.attendanceIntakeView(sessionId), {
      params: { limit, q: q || undefined },
    });
    return response.data;
  } catch (error) {
    if (suppressNotFound && error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateAttendanceSession({ sessionId, ...payload }) {
  const response = await axiosInstance.patch(API_ROUTES.attendanceUpdateSession(sessionId), payload);
  return response.data;
}

export async function scanAttendance({ sessionId, studentCode, arrivalTime, markMethod = "BARCODE" }) {
  const response = await axiosInstance.post(API_ROUTES.attendanceScan(sessionId), {
    studentCode,
    arrivalTime,
    markMethod,
  });
  return response.data;
}

export async function justifyAttendanceRecord({ recordId, justificationReason }) {
  const response = await axiosInstance.patch(API_ROUTES.attendanceJustifyRecord(recordId), {
    justificationReason,
  });
  return response.data;
}

export async function justifyAttendanceRecordsBatch({ recordIds, justificationReason }) {
  const response = await axiosInstance.patch(API_ROUTES.attendanceJustifyRecordsBatch, {
    recordIds,
    justificationReason,
  });
  return response.data;
}

export async function getAttendanceStudentMonthlySummary({ studentId, year, month }) {
  const response = await axiosInstance.get(API_ROUTES.attendanceStudentMonthlySummary(studentId), {
    params: { year, month },
  });
  return response.data;
}

export async function getAttendanceClassroomOptions() {
  const response = await axiosInstance.get(API_ROUTES.attendanceClassroomOptions);
  return response.data;
}

export async function getAttendanceClassroomDailyReport({ classroomId, date }) {
  const response = await axiosInstance.get(API_ROUTES.attendanceClassroomDailyReport(classroomId), {
    params: { date },
  });
  return response.data;
}

export async function getRecentAttendanceJustifications({ limit = 20 } = {}) {
  const response = await axiosInstance.get(API_ROUTES.attendanceRecentJustifications, {
    params: { limit },
  });
  return response.data;
}
