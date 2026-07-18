import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const addProduct = async ({ payload }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.add_product,
      method: "POST",
      data: payload
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
