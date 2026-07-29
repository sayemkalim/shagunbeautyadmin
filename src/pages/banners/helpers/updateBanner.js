import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateBanner = async ({ id, data }) => {
  const response = await apiService({
    endpoint: `${endpoints.banner}/${id}`,
    method: "PUT",
    data,
  });
  return response;
};
