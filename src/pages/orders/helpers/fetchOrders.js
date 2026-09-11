import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchOrders = async ({ params }) => {
  try {
    // Remove status from params if it's "all" (meaning no filter)
    const filteredParams = { ...params };
    if (filteredParams.status === "all") {
      delete filteredParams.status;
    }

    // Do not pass raw search parameter to backend because the backend API crashes
    // or returns 0 results for numeric order numbers, MongoDB ObjectIds, and customer names.
    // Full search across orderNumber, _id, mobile, and customer names is handled in the frontend.
    delete filteredParams.search;

    // Fetch full order dataset (up to 1000) so client-side search is instantaneous and comprehensive
    filteredParams.per_page = Math.max(Number(filteredParams.per_page) || 50, 1000);

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
