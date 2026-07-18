import { apiService } from "@/api/api_service/apiService";

export const createShipmentZone = async (data) => {
  const response = await apiService({
    endpoint: "api/delivery-zone",
    method: "POST",
    data,
  });
  return response;
};
