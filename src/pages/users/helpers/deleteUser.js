import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteUser = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.users}/${id}`,
      method: "DELETE",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}; 