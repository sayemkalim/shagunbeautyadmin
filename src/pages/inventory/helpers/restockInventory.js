import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const restockInventory = async ({ sku, quantity, note }) => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/${sku}/restock`,
      method: "POST",
      data: { quantity, note },
    });
  } catch (error) {
    console.error(error);
  }
};
