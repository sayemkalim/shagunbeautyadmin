import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchCouponById = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.coupon}/${id}`,
    method: "GET",
  });
  return response;
};
