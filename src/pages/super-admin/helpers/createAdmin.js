import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const createAdmin = async (formData) => {
  const result = await apiService({
    endpoint: endpoints.superadmin_register,
    method: "POST",
    data: formData,
  });
  if (result?.error || result?.success === false) {
    throw new Error(
      result?.message ||
      result?.response?.message ||
      "Something went wrong"
    );
  }
  return result.response;
};
