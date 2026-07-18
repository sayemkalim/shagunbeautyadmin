import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

;

export const fetchBlogById = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.blogs}/${id}`,
    });

    return apiResponse;
  } catch (error) {
    console.log(error);
  }
};
