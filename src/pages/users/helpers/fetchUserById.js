import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchUserById = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.users}/${id}`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}; 