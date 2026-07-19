import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchInventoryList = async ({ params }) => {
  try {
    return await apiService({
      endpoint: endpoints.inventory,
      method: "GET",
      params,
    });
  } catch (error) {
    console.error(error);
  }
};
