import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const updateBrand = async ({ id, payload }) => {
  try {
    const response = await apiService({
      endpoint: `${endpoints.brands}/${id}`,
      method: "PUT",
      data: payload,
    });

    return response;
  } catch (error) {
    console.error(error);
  }
};
