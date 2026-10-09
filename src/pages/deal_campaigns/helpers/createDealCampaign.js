import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createDealCampaign = async (data) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.deal_campaign,
      method: "POST",
      data,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error creating deal campaign:", error);
    throw error;
  }
};
