import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchOrderById = async ({ id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${id}`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
}; 