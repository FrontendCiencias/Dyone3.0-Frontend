import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getClassrooms } from "../services/admin.service";

export function useClassroomsQuery() {
  const token = getToken();

  return useQuery({
    queryKey: ["admin", "classrooms"],
    queryFn: getClassrooms,
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
