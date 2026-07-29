import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchBannerById = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.banner}/${id}`,
    method: "GET",
  });
  return response;
};
