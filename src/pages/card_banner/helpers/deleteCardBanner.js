import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteCardBanner = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.card_banner}/${id}`,
    method: "DELETE",
  });
  return response;
};
