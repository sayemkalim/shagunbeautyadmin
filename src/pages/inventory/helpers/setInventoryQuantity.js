import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const setInventoryQuantity = async ({ sku, quantity, note }) => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/${sku}/set`,
      method: "PATCH",
      data: { quantity, note },
    });
  } catch (error) {
    console.error(error);
  }
};
