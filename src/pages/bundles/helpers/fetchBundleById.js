import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchBundleById = async ({ id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.bundle}/${id}/`,
      method: "GET",
    });
    console.log("🚀 Product API response:", apiResponse); 

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
