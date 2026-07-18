import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchUsers = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: endpoints.users,
      method: "GET",
      params,
    });

    if (apiResponse?.response?.users) {
      return apiResponse?.response?.users;
    }

    return [];
  } catch (error) {
    console.error(error);
  }
};
