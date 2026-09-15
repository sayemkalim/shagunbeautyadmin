import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchCardBanners = async ({ params }) => {
  const sanitizedParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
      )
    : {};

  const response = await apiService({
    endpoint: endpoints.card_banner,
    method: "GET",
    params: sanitizedParams,
  });
  return response;
};
