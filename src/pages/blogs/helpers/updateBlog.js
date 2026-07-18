import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const updateBlog = async ({ payload, id }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.blogs}/edit/${id}`,
      method: "PUT",
      data: payload,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
