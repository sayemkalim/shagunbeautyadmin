import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchRevenueTrend = async () => {
  try {
    const { response } = await apiService({
      endpoint: endpoints.revenue_trend,
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
        error: response?.message || "Failed to fetch revenue trend data",
      };
    }
  } catch (error) {
    console.error("Error fetching revenue trend data:", error);
    return {
      success: false,
      error: "Failed to fetch revenue trend data",
    };
  }
};
