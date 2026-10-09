import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateDealCampaign = async ({ id, data }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.deal_campaign}/${id}`,
      method: "PUT",
      data,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating deal campaign:", error);
    throw error;
  }
};
