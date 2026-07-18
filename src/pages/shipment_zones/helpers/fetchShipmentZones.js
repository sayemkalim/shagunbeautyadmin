import { apiService } from "@/api/api_service/apiService";

export const fetchShipmentZones = async ({ params }) => {
  const response = await apiService({
    endpoint: "api/delivery-zone",
    method: "GET",
    params,
  });
  return response;
};
