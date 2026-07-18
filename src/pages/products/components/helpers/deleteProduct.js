import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";


export const deleteProduct = async (id) => {
  try {
    const apiResponse = await apiService({
      endpoint: `${endpoints.product}/${id}`,
      method: "DELETE",
    });

    return apiResponse?.response; // return full response, including success & message
  } catch (error) {
    console.error(error);
    throw error; // rethrow so `onError` gets triggered in mutation
  }
};
