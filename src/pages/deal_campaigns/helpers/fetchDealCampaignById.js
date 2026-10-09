import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchDealCampaignById = async ({ id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.deal_campaign}/${id}`,
      method: "GET",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error fetching deal campaign by id:", error);
    throw error;
  }
};
