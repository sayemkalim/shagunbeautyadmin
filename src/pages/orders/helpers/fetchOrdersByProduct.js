import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchOrdersByProduct = async (productId) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const endpoint = `${endpoints.order}/by-product/${productId}`;

    const response = await apiService({
      endpoint,
      method: "GET",
    });

    return response;
  } catch (error) {
    console.error("Error fetching orders by product:", error);
    throw error;
  }
};
