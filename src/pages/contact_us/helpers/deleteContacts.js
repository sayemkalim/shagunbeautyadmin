import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const deleteContacts = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.contact}/${id}`,
      method: "DELETE",
    });

    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
