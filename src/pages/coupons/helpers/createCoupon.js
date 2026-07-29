import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createCoupon = async (data) => {
  const response = await apiService({
    endpoint: endpoints.coupon,
    method: "POST",
    data,
  });
  return response;
};
