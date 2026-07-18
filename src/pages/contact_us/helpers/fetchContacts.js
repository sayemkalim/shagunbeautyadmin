import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const fetchContacts = async ({ params }) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.contact}`,
      method: "GET",
      params,
    });
// console.log(apiResponse,"sayem")
    return apiResponse;
  } catch (error) {
    console.error(error);
  }
};
