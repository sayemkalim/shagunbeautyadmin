import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchCardBannerById = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.card_banner}/${id}`,
    method: "GET",
  });
  return response;
};
