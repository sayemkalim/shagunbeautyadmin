import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const generatePaymentLink = async ({ orderId, amount }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.generate_payment_link,
      method: "POST",
      data: {
        orderId,
        amount
      },
    });

    return apiResponse;
  } catch (error) {
    console.error("Error generating payment link:", error);
    throw error;
  }
};
