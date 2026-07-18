import { apiService } from "@/api/api_service/apiService";

export const deleteShipmentZone = async (id) => {
  const response = await apiService({
    endpoint: `api/delivery-zone/${id}`,
    method: "DELETE",
  });
  return response;
};
