import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchAdminById = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.admin}/${id}`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}; 