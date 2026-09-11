import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchMarqueeById = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.marquee}/${id}`,
    method: "GET",
  });
  return response;
};
