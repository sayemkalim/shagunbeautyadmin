import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchBrandById = async ({ id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.brands}/${id}/`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
