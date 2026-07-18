import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const sendOrderDetails = async ({ orderId }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}/send-details`,
      method: "POST",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error sending order details:", error);
    throw error;
  }
}; 