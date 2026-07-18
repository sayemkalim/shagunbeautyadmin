import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchMonthlyGrowth = async () => {
  try {
    const { response } = await apiService({
      endpoint: endpoints.monthly_growth,
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
        error: response?.message || "Failed to fetch monthly growth data",
      };
    }
  } catch (error) {
    console.error("Error fetching monthly growth data:", error);
    return {
      success: false,
      error: "Failed to fetch monthly growth data",
    };
  }
};
