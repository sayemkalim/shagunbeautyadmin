import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchOrders = async ({ params }) => {
  try {
    // Remove status from params if it's "all" (meaning no filter)
    const filteredParams = { ...params };
    if (filteredParams.status === "all") {
      delete filteredParams.status;
    }

    const apiResponse = await apiService({
      endpoint: endpoints.order,
      params: filteredParams,
    });

    return apiResponse;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};
