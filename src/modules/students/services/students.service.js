import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function searchStudents({ q, limit = 10, cursor = null }) {
  const params = { q, limit };
  if (cursor) params.cursor = cursor;
  const res = await axiosInstance.get(API_ROUTES.students, { params });
  return res.data;
}

export async function getStudentSummary(studentId) {
  const res = await axiosInstance.get(API_ROUTES.studentSummary(studentId));
  return res.data;
}
