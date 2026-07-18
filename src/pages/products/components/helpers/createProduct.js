import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const createProduct = async (formData, params) => {
  try {
    const response = await apiService({
      endpoint: endpoints.product,
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
