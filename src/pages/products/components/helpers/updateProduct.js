import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const updateProduct = async ({ id, payload }) => {
  try {
    const response = await apiService({
      endpoint: `${endpoints.product}/${id}`,
      method: "PUT",
      data: payload,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response;
  } catch (error) {
    console.error(error);
  }
};
