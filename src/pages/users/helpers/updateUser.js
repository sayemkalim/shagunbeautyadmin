import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateUser = async ({ payload, id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.users}/${id}`,
      method: "PATCH",
      data: payload,
      hasFile: false,
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}; 