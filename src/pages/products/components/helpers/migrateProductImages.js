import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const migrateProductImages = async ({ id }) => {
  const apiResponse = await apiService({
    endpoint: `${endpoints.product_migrate_images}/${id}`,
    method: "POST",
  });

  return apiResponse;
};

