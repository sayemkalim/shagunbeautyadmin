import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateCodSettings = async ({ data }) => {
  const response = await apiService({
    endpoint: endpoints.cod_settings,
    method: "POST",
    data,
  });
  return response;
};
