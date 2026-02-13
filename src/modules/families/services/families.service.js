import axiosInstance from "../../../lib/axios";
import { API_ROUTES } from "../../../config/apiRoutes";

export async function linkStudentFamily(payload) {
  const res = await axiosInstance.post(API_ROUTES.familiesLinkStudent, payload);
  return res.data;
}
