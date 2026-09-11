import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchOrderBill = async ({ id, regenerate = false }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order_bill}/payment/${id}/bill`,
      method: "GET",
      params: regenerate ? { regenerate: "true" } : undefined,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error fetching order bill:", error);
    throw error;
  }
};
