import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchMarquees = async ({ params }) => {
  const response = await apiService({
    endpoint: endpoints.marquee,
    method: "GET",
    params,
  });
  return response;
};
