import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateOrderItems = async ({ orderId, items }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}/items`,
      method: "PUT",
      data: { items },
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating order items:", error);
    throw error;
  }
}; 