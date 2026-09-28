import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateRefundStatus = async ({ orderId, payload }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}/refund-status`,
      method: "PATCH",
      data: payload,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating refund status:", error);
    throw error;
  }
};
