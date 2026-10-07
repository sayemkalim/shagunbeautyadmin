import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const assignShiprocketAwb = async ({ orderId, courier_id }) => {
  try {
    const endpoint =
      typeof endpoints.shiprocket_assign_awb === "function"
        ? endpoints.shiprocket_assign_awb(orderId)
        : `${endpoints.order}/${orderId}/shiprocket/assign-awb`;

    const apiResponse = await apiService({
      endpoint,
      method: "POST",
      data: { courier_id },
    });

    return apiResponse;
  } catch (error) {
    console.error("Error assigning Shiprocket AWB:", error);
    throw error;
  }
};
