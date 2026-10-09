import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchDealCampaigns = async ({ params = {} }) => {
  try {
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
    );

    const apiResponse = await apiService({
      endpoint: endpoints.deal_campaign,
      method: "GET",
      params: sanitizedParams,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error fetching deal campaigns:", error);
    throw error;
  }
};
