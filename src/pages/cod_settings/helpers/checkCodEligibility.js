import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const checkCodEligibility = async ({ pincode, amount }) => {
  const response = await apiService({
    endpoint: endpoints.cod_check,
    method: "GET",
    params: { pincode, amount },
  });
  return response;
};
