import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchInventoryMovements = async ({ params }) => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/movements`,
      method: "GET",
      params,
    });
  } catch (error) {
    console.error(error);
  }
};
