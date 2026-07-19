import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchInventoryBySku = async ({ sku }) => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/${sku}`,
      method: "GET",
    });
  } catch (error) {
    console.error(error);
  }
};
