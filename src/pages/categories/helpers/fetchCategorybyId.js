import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchCategoryById = async ({ id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.category}/${id}/`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
