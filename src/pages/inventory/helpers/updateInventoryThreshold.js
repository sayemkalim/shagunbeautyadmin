import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateInventoryThreshold = async ({ sku, low_stock_threshold }) => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/${sku}/threshold`,
      method: "PATCH",
      data: { low_stock_threshold },
    });
  } catch (error) {
    console.error(error);
  }
};
