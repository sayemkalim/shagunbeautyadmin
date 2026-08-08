import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteVariant = async ({ productId, sku }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.product}/${productId}/variants/${encodeURIComponent(sku)}`,
      method: "DELETE",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error deleting variant:", error);
    throw error;
  }
};
