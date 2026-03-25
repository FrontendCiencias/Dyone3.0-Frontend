import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../lib/authStorage";
import { getClassroomBoard } from "../../students/services/students.service";

export function useClassroomBoardQuery({ campus, level, grade }) {
  const token = getToken();
  const enabled = Boolean(token) && Boolean(campus) && Boolean(level) && Boolean(grade);

  return useQuery({
    queryKey: ["classroom-board", campus || null, level || null, grade || null],
    queryFn: () => getClassroomBoard({ campus, level, grade }),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
