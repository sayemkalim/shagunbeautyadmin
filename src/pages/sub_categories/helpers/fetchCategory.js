import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchCategory = async ({ params }) => {
  try {
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );

    const { response } = await apiService({
      endpoint: endpoints.category,
      method: "GET",
      params: sanitizedParams,
    });

    // console.log("API response inside fetchProducts:", response);

    // Return only the nested data layer needed by ProductsTable
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

