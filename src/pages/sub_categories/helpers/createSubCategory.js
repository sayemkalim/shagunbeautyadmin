import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";



export const createSubCategory = async (formData, params) => {
  try {
    const response = await apiService({
      endpoint: endpoints.subcategory,
      method: "POST",
      data: formData,
      params: params,
      hasFile: true,  

    });

    return response;
  } catch (error) {
    console.error(error);
  }
};
