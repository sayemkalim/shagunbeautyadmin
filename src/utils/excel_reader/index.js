import * as XLSX from "xlsx";

// Helper function to clean HTML content and extract meaningful text
const cleanHtmlContent = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  let cleanedContent = content;
  
  // First, handle WordPress-style comments and escaped content
  cleanedContent = cleanedContent
    // Remove WordPress comments like <!-- wp:paragraph {...} -->
    .replace(/<!--\s*wp:[^>]*-->/g, '')
    // Remove closing WordPress comments like <!-- /wp:paragraph -->
    .replace(/<!--\s*\/wp:[^>]*-->/g, '')
    // Handle escaped quotes and backslashes
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n');
  
  // Remove all HTML tags (including complex ones with attributes)
  cleanedContent = cleanedContent.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  cleanedContent = cleanedContent
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'") // Right single quotation mark
    .replace(/&#8220;/g, '"') // Left double quotation mark
    .replace(/&#8221;/g, '"') // Right double quotation mark
    .replace(/&#8211;/g, '–') // En dash
    .replace(/&#8212;/g, '—'); // Em dash
  
  // Clean up extra whitespace and newlines
  cleanedContent = cleanedContent
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
  
  return cleanedContent;
};

// Helper function to process and group multiple tags
const processRowData = (rawData) => {
  const processedData = [];
  const rowMap = new Map();

  rawData.forEach((row, index) => {
    // Use name if available, otherwise use row index as unique identifier
    const name = row.name || row.Name || `product_${index}`;

    if (!rowMap.has(name)) {
      // Create new product entry
      const productData = { ...row };
      
      // Clean HTML content from descriptions
      if (productData.full_description || productData['Full Description']) {
        const fullDesc = productData.full_description || productData['Full Description'];
        productData.full_description = cleanHtmlContent(fullDesc);
        delete productData['Full Description'];
      }
      
      if (productData.small_description || productData['Small Description']) {
        const smallDesc = productData.small_description || productData['Small Description'];
        productData.small_description = cleanHtmlContent(smallDesc);
        delete productData['Small Description'];
      }

      // Initialize tags array
      productData.tags = [];
      
      // Add first tag if exists
      if (row.tags) {
        const tagValue = row.tags;
        if (tagValue && tagValue.trim()) {
          productData.tags.push(tagValue.trim());
        }
      }

      rowMap.set(name, productData);
    } else {
      // Add additional tags to existing product
      const existingProduct = rowMap.get(name);
      if (row.tags && row.tags.trim()) {
        existingProduct.tags.push(row.tags.trim());
      }
    }
  });

  // Convert map to array and clean up empty tags
  rowMap.forEach(product => {
    product.tags = [...new Set(product.tags.filter(tag => tag && tag.trim()))]; // Remove duplicates and empty tags
    processedData.push(product);
  });

  return processedData;
};

export const extractDataFromExcel = (selectedFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJsonData = XLSX.utils.sheet_to_json(sheet);
        
        console.log("Raw Excel Data:", rawJsonData);
        
        // Test HTML cleaning with a sample
        const testHtml = '<!-- wp:paragraph {"style":{"elements":{"link":{"color":{"text":"var:preset|color|foreground"}}}},"textColor":"foreground"} -->\\n<p class="has-foreground-color has-text-color has-link-color"><strong>Bewell Soft Chapati Atta</strong></p>';
        console.log("HTML Cleaning Test:");
        console.log("Original:", testHtml);
        console.log("Cleaned:", cleanHtmlContent(testHtml));
        
        // Process the data to handle multiple tags and clean HTML
        const processedData = processRowData(rawJsonData);
        
        console.log("Processed Excel Data:", processedData);
        
        resolve(processedData);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(error);
    };

    reader.readAsArrayBuffer(selectedFile);
  });
};