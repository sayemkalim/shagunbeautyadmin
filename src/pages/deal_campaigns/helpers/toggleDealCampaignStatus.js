import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const toggleDealCampaignStatus = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.deal_campaign}/${id}/toggle-status`,
      method: "PATCH",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error toggling deal campaign status:", error);
    throw error;
  }
};
