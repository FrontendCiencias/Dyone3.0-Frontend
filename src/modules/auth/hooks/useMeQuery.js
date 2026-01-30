import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { getToken, setUser, setUserRoles, clearUser } from "../../../lib/authStorage";
import { API_ROUTES } from "../../../config/apiRoutes";

export function useMeQuery() {
  const token = getToken();

  return useQuery({
    queryKey: ["auth", "me"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await axiosInstance.get(API_ROUTES.me);
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    onSuccess: (data) => {
      setUser(data?.user || null);
      setUserRoles(data?.roles || []);
    },
    onError: () => {
      clearUser();
    },
  });
}