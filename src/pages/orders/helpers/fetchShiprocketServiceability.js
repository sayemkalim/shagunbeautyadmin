import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const SHAGUN_BEAUTY_PICKUP_PINCODE = "206001";

export const fetchShiprocketServiceability = async ({
  orderId,
  pickup_postcode = SHAGUN_BEAUTY_PICKUP_PINCODE,
  delivery_postcode,
  weight,
  length,
  breadth,
  height,
  cod,
  declared_value,
  is_return = 0,
}) => {
  try {
    const endpoint =
      typeof endpoints.shiprocket_serviceability === "function"
        ? endpoints.shiprocket_serviceability(orderId)
        : `${endpoints.order}/${orderId}/shiprocket/serviceability`;

    const params = {};
    const finalPickup = String(pickup_postcode || SHAGUN_BEAUTY_PICKUP_PINCODE).trim();
    if (finalPickup) {
      params.pickup_postcode = finalPickup;
    }
    if (delivery_postcode != null && String(delivery_postcode).trim() !== "") {
      params.delivery_postcode = String(delivery_postcode).trim();
    }
    if (weight != null && !isNaN(Number(weight)) && Number(weight) > 0) {
      params.weight = Number(weight);
    }
    if (length != null && !isNaN(Number(length)) && Number(length) > 0) {
      params.length = Number(length);
    }
    if (breadth != null && !isNaN(Number(breadth)) && Number(breadth) > 0) {
      params.breadth = Number(breadth);
    }
    if (height != null && !isNaN(Number(height)) && Number(height) > 0) {
      params.height = Number(height);
    }
    if (cod !== undefined && cod !== null) {
      params.cod =
        cod === 1 || cod === "1" || cod === true || String(cod).toUpperCase() === "COD"
          ? 1
          : 0;
    }
    if (declared_value != null && !isNaN(Number(declared_value)) && Number(declared_value) > 0) {
      params.declared_value = Number(declared_value);
    }
    params.is_return = is_return ? 1 : 0;

    const apiResponse = await apiService({
      endpoint,
      method: "GET",
      params,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error fetching Shiprocket serviceability:", error);
    throw error;
  }
};
