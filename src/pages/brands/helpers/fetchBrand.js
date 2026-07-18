import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchBrand = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.brands,
      method: "GET",
      params,
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
