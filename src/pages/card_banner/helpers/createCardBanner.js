import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createCardBanner = async (data) => {
  const response = await apiService({
    endpoint: endpoints.card_banner,
    method: "POST",
    data,
  });
  return response;
};
