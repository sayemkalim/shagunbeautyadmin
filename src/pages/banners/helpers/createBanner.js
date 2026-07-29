import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createBanner = async (data) => {
  const response = await apiService({
    endpoint: endpoints.banner,
    method: "POST",
    data,
  });
  return response;
};
