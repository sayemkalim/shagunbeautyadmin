import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateMarquee = async ({ id, data }) => {
  const response = await apiService({
    endpoint: `${endpoints.marquee}/${id}`,
    method: "PUT",
    data,
  });
  return response;
};
