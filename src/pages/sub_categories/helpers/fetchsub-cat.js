import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchSubCategory = async ({ params = {} } = {}) => {
  try {
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );
    const { response } = await apiService({
      endpoint: endpoints.subcategory, 
      method: "GET",
      params: sanitizedParams,
    });
    return response;
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    throw error;
  }
};


