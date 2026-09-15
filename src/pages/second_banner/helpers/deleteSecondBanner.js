import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteSecondBanner = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.second_banner}/${id}`,
    method: "DELETE",
  });
  return response;
};
