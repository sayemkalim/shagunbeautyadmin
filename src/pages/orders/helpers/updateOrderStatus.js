import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateOrderStatus = async ({ orderId, status }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}`,
      method: "PUT",
      data: { status },
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}; 