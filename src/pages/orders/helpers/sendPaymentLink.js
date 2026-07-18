import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const sendPaymentLink = async ({ orderId }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}/send-payment-link`,
      method: "POST",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error sending payment link:", error);
    throw error;
  }
}; 