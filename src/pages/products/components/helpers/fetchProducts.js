import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchProducts = async ({ params }) => {
  try {
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );

    const { response } = await apiService({
      endpoint: endpoints.product,
      method: "GET",
      params: sanitizedParams,
    });

    // console.log("API response inside fetchProducts:", response);

    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

