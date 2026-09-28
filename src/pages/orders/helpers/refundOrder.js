import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const refundOrder = async ({ orderId, payload }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}/refund`,
      method: "POST",
      data: payload,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error processing order refund:", error);
    throw error;
  }
};
