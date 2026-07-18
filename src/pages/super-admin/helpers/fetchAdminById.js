import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const fetchAdminById = async (id) => {
  try {
    console.log("Admin ID:", id);

    const apiResponse = await apiService({
      endpoint: `${endpoints.superadmin}/get-admin/${id}`,
      method: "GET",
    });

    console.log("API Response:", apiResponse);

    return apiResponse;

  } catch (error) {
    console.error("Error while fetching admin:", error);
    throw error;
  }
};
