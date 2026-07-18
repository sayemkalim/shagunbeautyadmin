import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const exportProducts = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint:  endpoints.bulk_export_products,
      params,
    });
    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
