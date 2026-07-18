import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createUser = async (formData) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.users,
      method: "POST",
      data: formData,
      hasFile: false,
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}; 