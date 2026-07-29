import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteBanner = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.banner}/${id}`,
    method: "DELETE",
  });
  return response;
};
