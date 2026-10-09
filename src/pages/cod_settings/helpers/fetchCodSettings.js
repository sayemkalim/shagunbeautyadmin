import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchCodSettings = async () => {
  const response = await apiService({
    endpoint: endpoints.cod_settings,
    method: "GET",
  });
  return response;
};
