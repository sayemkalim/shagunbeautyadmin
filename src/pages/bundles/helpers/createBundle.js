import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";




export const createBundle = async (formData) => {
  try {
    const response = await apiService({
      endpoint: endpoints.bundle,
      method: "POST",
      data: formData,
      hasFile: true,  
    });

    return response;
  } catch (error) {
    console.error(error);
  }
};
