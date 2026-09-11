import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteMarquee = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.marquee}/${id}`,
    method: "DELETE",
  });
  return response;
};
