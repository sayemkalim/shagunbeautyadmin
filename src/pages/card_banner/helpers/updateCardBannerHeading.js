import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateCardBannerHeading = async ({ heading }) => {
  const response = await apiService({
    endpoint: endpoints.card_banner_heading || `${endpoints.card_banner}/heading`,
    method: "PUT",
    data: { heading },
  });
  return response;
};
