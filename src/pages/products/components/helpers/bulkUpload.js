import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

// Utility function to split array into chunks
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Function to upload a single batch
const uploadBatch = async (batch, batchIndex, totalBatches) => {
  try {
    console.log(`Uploading batch ${batchIndex + 1}/${totalBatches} with ${batch.length} items`);
    
    const apiResponse = await apiService({
      endpoint: endpoints.bulk_upload,
      method: "POST",
      data: batch
    });

    console.log(`Batch ${batchIndex + 1} API response:`, apiResponse);

    if (apiResponse?.response?.success) {
      return {
        success: true,
        batchIndex,
        data: apiResponse.response,
        processedCount: batch.length
      };
    }

    return {
      success: false,
      batchIndex,
      error: "API response indicates failure",
      data: apiResponse?.response || {}
    };
  } catch (error) {
    console.error(`Batch ${batchIndex + 1} upload error:`, error);
    return {
      success: false,
      batchIndex,
      error: error.message,
      processedCount: 0
    };
  }
};

export const productBulkUpload = async ({ payload, onBatchProgress }) => {
  try {
    console.log("Starting batch upload with payload:", payload.length, "items");
    
    const BATCH_SIZE = 50;
    const batches = chunkArray(payload, BATCH_SIZE);
    const totalBatches = batches.length;
    
    console.log(`Split into ${totalBatches} batches of max ${BATCH_SIZE} items each`);

    let totalSuccessful = 0;
    let totalFailed = 0;
    const failedBatches = [];
    const allFailedItems = [];

    // Process batches sequentially
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Call progress callback if provided
      if (onBatchProgress) {
        onBatchProgress({
          currentBatch: i + 1,
          totalBatches,
          currentBatchSize: batch.length,
          totalProcessed: totalSuccessful,
          totalFailed
        });
      }

      const result = await uploadBatch(batch, i, totalBatches);
      
      if (result.success) {
        totalSuccessful += result.processedCount;
        console.log(`Batch ${i + 1} completed successfully. Total successful: ${totalSuccessful}`);
      } else {
        totalFailed += batch.length;
        failedBatches.push({
          batchIndex: i,
          error: result.error,
          items: batch
        });
        
        // Add failed items to the overall failed list
        if (result.data?.failed) {
          allFailedItems.push(...result.data.failed);
        } else {
          // If no specific failed items, assume all items in batch failed
          allFailedItems.push(...batch);
        }
        
        console.log(`Batch ${i + 1} failed: ${result.error}. Total failed: ${totalFailed}`);
      }

      // Small delay between batches to avoid overwhelming the server
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final progress update
    if (onBatchProgress) {
      onBatchProgress({
        currentBatch: totalBatches,
        totalBatches,
        currentBatchSize: 0,
        totalProcessed: totalSuccessful,
        totalFailed,
        completed: true
      });
    }

    console.log(`Batch upload completed. Successful: ${totalSuccessful}, Failed: ${totalFailed}`);

    return {
      success: totalFailed === 0,
      data: {
        successful: totalSuccessful,
        failed: allFailedItems,
        failedBatches,
        totalBatches,
        processedBatches: totalBatches
      }
    };

  } catch (error) {
    console.error("Batch upload error:", error);
    throw error;
  }
};