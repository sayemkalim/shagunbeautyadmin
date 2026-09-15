import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateSecondBanner = async ({ id, data }) => {
  const response = await apiService({
    endpoint: `${endpoints.second_banner}/${id}`,
    method: "PUT",
    data,
  });
  return response;
};
