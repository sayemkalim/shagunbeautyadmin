import { apiService } from "@/api/api_service/apiService";

export const updateShipmentZone = async ({ id, data }) => {
  const response = await apiService({
    endpoint: `api/delivery-zone/${id}`,
    method: "PUT",
    data,
  });
  return response;
};
