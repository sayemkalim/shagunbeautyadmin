import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchBlogs = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.blogs}`,
      method: "GET",
      params,
    });

    console.log("Full API response:", apiResponse);  // <--- Log the whole response

    // For now, just return the full response to inspect it in your React Query devtools or console.
    return apiResponse;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw error;
  }
};

