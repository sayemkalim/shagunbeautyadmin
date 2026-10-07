import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createShiprocketOrder = async ({
  orderId,
  pickup_location = "Shagun Beauty",
  weight,
  length,
  breadth,
  height,
}) => {
  try {
    const endpoint =
      typeof endpoints.shiprocket_create === "function"
        ? endpoints.shiprocket_create(orderId)
        : `${endpoints.order}/${orderId}/shiprocket/create`;

    const apiResponse = await apiService({
      endpoint,
      method: "POST",
      data: {
        pickup_location,
        weight: Number(weight),
        length: Number(length),
        breadth: Number(breadth),
        height: Number(height),
      },
    });

    return apiResponse;
  } catch (error) {
    console.error("Error creating Shiprocket order:", error);
    throw error;
  }
};
