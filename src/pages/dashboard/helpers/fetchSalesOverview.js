import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchSalesOverview = async () => {
  try {
    const { response } = await apiService({
      endpoint: endpoints.sales_overview,
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
        error: response?.message || "Failed to fetch sales overview",
      };
    }
  } catch (error) {
    console.error("Error fetching sales overview:", error);
    return {
      success: false,
      error: "Failed to fetch sales overview",
    };
  }
};
