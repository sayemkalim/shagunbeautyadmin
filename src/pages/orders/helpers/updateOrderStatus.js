import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateOrderStatus = async ({ orderId, status, codPaymentMethod }) => {
  try {
    const data = { status };
    if (codPaymentMethod) {
      data.codPaymentMethod = codPaymentMethod;
    }

    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}/status`,
      method: "PATCH",
      data,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};
 