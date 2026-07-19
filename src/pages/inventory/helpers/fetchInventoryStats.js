import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchInventoryStats = async () => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/stats`,
      method: "GET",
    });
  } catch (error) {
    console.error(error);
  }
};
