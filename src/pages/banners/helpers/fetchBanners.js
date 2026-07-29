import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchBanners = async ({ params }) => {
  const response = await apiService({
    endpoint: endpoints.banner,
    method: "GET",
    params,
  });
  return response;
};
