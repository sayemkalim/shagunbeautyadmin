import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateDeliverySettings = async ({ data }) => {
  const response = await apiService({
    endpoint: endpoints.delivery_settings,
    method: "POST",
    data,
  });
  return response;
};
