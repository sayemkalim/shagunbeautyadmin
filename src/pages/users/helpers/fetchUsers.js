import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchUsers = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.users,
      method: "GET",
      params,
    });

    // The API returns { data: [...], ... }
    if (apiResponse?.response?.success && Array.isArray(apiResponse?.response?.data)) {
      return {
        data: apiResponse.response.data,
        total: apiResponse.response.data.length, // or use a total from backend if available
      };
    }

    return { data: [], total: 0 };
  } catch (error) {
    console.error(error);
    return { data: [], total: 0 };
  }
}; 