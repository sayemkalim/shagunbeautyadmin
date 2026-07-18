import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchDashboardOverview = async () => {
  try {
    const { response } = await apiService({
      endpoint: endpoints.dashboard_overview,
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
        error: response?.message || "Failed to fetch dashboard overview",
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard overview",
    };
  }
};
