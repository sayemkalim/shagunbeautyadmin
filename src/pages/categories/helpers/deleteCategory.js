import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const deleteCategory = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.category}/${id}`,
      method: "DELETE",
    });
    return apiResponse?.response;
  } catch (error) {
    console.error("Delete brand error:", error);
    throw error; 
  }
};
