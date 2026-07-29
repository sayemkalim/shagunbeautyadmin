import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchCoupons = async ({ params }) => {
  const response = await apiService({
    endpoint: endpoints.coupon,
    method: "GET",
    params,
  });
  return response;
};
