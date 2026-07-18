import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateSubCategory = async ({ id, payload }) => {
  try {
    const { response } = await apiService({
      endpoint: `${endpoints.subcategory}/${id}`,
      method: "PUT",
      body: payload,
    });
    return response;
  } catch (error) {
    console.error("Error updating subcategory:", error);
    throw error;
  }
};
