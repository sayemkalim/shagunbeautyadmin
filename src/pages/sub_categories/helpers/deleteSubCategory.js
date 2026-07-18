import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const deleteCategory = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.subcategory}/${id}`,
      method: "DELETE",
    });
    return apiResponse?.response;
  } catch (error) {
    console.error("Delete subcategory error:", error);
    throw error; 
  }
};
