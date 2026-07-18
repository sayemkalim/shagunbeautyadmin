import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchUserCartById = async (id) => {
    try {
      const apiResponse = await apiService({
        endpoint: `${endpoints.users_cart}/${id}`,
        method: "GET",
      });
      if (apiResponse?.response?.data) {
        return apiResponse?.response?.data;
      }
  
      return [];
    } catch (error) {
      console.error(error);
    }
  };
  