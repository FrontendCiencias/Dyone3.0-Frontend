import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { setToken, setUser, setUserRoles } from "../../../lib/authStorage";
import { API_ROUTES } from "../../../config/apiRoutes";

export function useLoginMutation({ onSuccessNavigate } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await axiosInstance.post(API_ROUTES.login, { email, password });
      return res.data; 
    },
    retry: false,
    onSuccess: async (data) => {
      const token = data?.token;

      if (token) {
        setToken(token);
      }

      const meData = await queryClient.fetchQuery({
        queryKey: ["auth", "me"],
        queryFn: async () => {
          const res = await axiosInstance.get(API_ROUTES.me);
          return res.data;
        },
        staleTime: 0,
      });

      setUser(meData?.user || null);
      setUserRoles(meData?.roles || []);

      onSuccessNavigate?.(meData);
    },
  });
}
