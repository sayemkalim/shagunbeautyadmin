import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateCoupon = async ({ id, data }) => {
  const response = await apiService({
    endpoint: `${endpoints.coupon}/${id}`,
    method: "PUT",
    data,
  });
  return response;
};
