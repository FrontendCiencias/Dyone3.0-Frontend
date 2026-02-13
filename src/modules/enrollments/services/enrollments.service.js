import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function createQuickEnrollment(payload) {
  const res = await axiosInstance.post(API_ROUTES.enrollments, payload);
  return res.data;
}
