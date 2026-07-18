import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const createBrand = async (formData, params) => {
  try {
    const response = await apiService({
      endpoint: endpoints.brands,
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
