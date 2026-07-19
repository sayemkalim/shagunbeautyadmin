import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const syncInventory = async () => {
  try {
    return await apiService({
      endpoint: `${endpoints.inventory}/sync`,
      method: "POST",
    });
  } catch (error) {
    console.error(error);
  }
};
