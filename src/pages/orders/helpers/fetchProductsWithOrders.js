import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchProductsWithOrders = async ({ params = {} }) => {
  try {
    // Filter out empty/undefined params and handle "all" status
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        // Skip status parameter if it's "all" (meaning no filter)
        if (key === 'status' && params[key] === 'all') {
          return;
        }
        cleanParams[key] = params[key];
      }
    });

    const endpoint = `${endpoints.order}/products-with-orders`;

    const response = await apiService({
      endpoint,
      method: "GET",
      params: cleanParams,
    });

    return response;
  } catch (error) {
    console.error("Error fetching products with orders:", error);
    throw error;
  }
};
