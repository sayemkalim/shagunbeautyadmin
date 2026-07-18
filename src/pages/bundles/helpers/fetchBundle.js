import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchBundle = async ({ params }) => {
  try {
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );

    const { response } = await apiService({
      endpoint: endpoints.bundle,
      method: "GET",
      params: sanitizedParams,
    });
    return response;
  } catch (error) {
    console.error("Error fetching bundle:", error);
    throw error;
  }
};

