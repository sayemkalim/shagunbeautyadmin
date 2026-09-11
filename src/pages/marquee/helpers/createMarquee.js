import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createMarquee = async (data) => {
  const response = await apiService({
    endpoint: endpoints.marquee,
    method: "POST",
    data,
  });
  return response;
};
