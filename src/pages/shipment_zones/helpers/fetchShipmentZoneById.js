import { apiService } from "@/api/api_service/apiService";

export const fetchShipmentZoneById = async (id) => {
  const response = await apiService({
    endpoint: `api/delivery-zone/${id}`,
    method: "GET",
  });
  return response;
};
