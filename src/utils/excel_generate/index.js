import * as excelJs from "exceljs";

export const generateTemplate = async (columnHeader, categoryDropdownOptions) => {
  const workbook = new excelJs.Workbook();
  const ws = workbook.addWorksheet("Product Sheet");

  const categoryOptions = categoryDropdownOptions;

  const headers = columnHeader;
  ws.addRow(headers);

  ws.columns = headers.map((header) => ({
    header,
    width: 22,
    key: header.toLowerCase().replace(" ", "_"),
  }));

  const DROPDOWN_ROWS = 25;

  ws.dataValidations.add(`C2:C${DROPDOWN_ROWS + 1}`, {
    type: "list",
    allowBlank: false,
    formulae: [`"${categoryOptions.join(",")}"`],
    showErrorMessage: true,
    error: "Invalid category selection",
    showInputMessage: true,
    prompt: "Select product category",
  });
  ws.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2F75B5" },
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      name: "Calibri",
      size: 11,
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const excelBlob = await workbook.xlsx.writeBuffer();
  const excelUrl = URL.createObjectURL(
    new Blob([excelBlob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );

  const link = document.createElement("a");
  link.href = excelUrl;
  link.download = "product_sample.xlsx";
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(excelUrl);
  document.body.removeChild(link);
};
