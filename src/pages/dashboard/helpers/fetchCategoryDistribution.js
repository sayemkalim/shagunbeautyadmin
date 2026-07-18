import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchCategoryDistribution = async () => {
  try {
    const { response } = await apiService({
      endpoint: endpoints.category_distribution,
      method: "GET",
    });

    if (response?.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        error: response?.message || "Failed to fetch category distribution data",
      };
    }
  } catch (error) {
    console.error("Error fetching category distribution data:", error);
    return {
      success: false,
      error: "Failed to fetch category distribution data",
    };
  }
};
