import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const adjustInventory = async ({ sku, quantityChange, note }) => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/${sku}/adjust`,
      method: "PATCH",
      data: { quantityChange, note },
    });
  } catch (error) {
    console.error(error);
  }
};
