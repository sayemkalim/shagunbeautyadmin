import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteDealCampaign = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.deal_campaign}/${id}`,
      method: "DELETE",
    });

    return apiResponse;
  } catch (error) {
    console.error("Error deleting deal campaign:", error);
    throw error;
  }
};
