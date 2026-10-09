import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchDeliverySettings = async () => {
  const response = await apiService({
    endpoint: endpoints.delivery_settings,
    method: "GET",
  });
  return response;
};
