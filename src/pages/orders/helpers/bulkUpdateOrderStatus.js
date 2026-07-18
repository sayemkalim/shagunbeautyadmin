import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const bulkUpdateOrderStatus = async ({ orderIds, status }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.bulk_order_status,
      method: "PATCH",
      data: {
        updates: orderIds.map(id => ({ id })),
        status,
      },
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating bulk order status:", error);
    throw error;
  }
};

