import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const deleteCoupon = async (id) => {
  const response = await apiService({
    endpoint: `${endpoints.coupon}/${id}`,
    method: "DELETE",
  });
  return response;
};
