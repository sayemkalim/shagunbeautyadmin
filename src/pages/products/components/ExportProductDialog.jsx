import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { exportProducts } from "./helpers/exportProducts";

const ExportProductDialog = ({
  openDialog,
  onClose,
  params,
}) => {
  const { mutate: exportMutation, isPending } = useMutation({
    mutationFn: async (type) => {
      const updatedParams = {
        ...params,
        fileType: type,
        productIds: params?.productIds || [], // fallback if needed
      };
      const apiResponse = await exportProducts({ params: updatedParams });
      if (apiResponse?.response?.success) {
        const data = apiResponse?.response?.data;

        const link = document.createElement("a");
        link.href = data.url;
        link.setAttribute(
          "download",
          data.filename || (type === "csv" ? "products.csv" : "products.xlsx")
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success("File downloaded!");
      } else {
        const data = apiResponse?.response?.data;
        toast.error(`Download failed: ${data?.message}`);
      }
    },
  });

  const handleDownload = (type) => {
    exportMutation(type);
  };

  return (
    <Dialog
      open={openDialog}
      onOpenChange={onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Export Products
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-3">
          <Button
            className="flex w-full items-center gap-2"
            onClick={() => handleDownload("csv")}
            disabled={isPending}
            variant="outline"
          >
            <FileDown size={18} />
            Download as CSV
          </Button>
          <Button
            className="flex w-full items-center gap-2"
            onClick={() => handleDownload("xlsx")}
            disabled={isPending}
          >
            <FileSpreadsheet size={18} />
            Download as Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportProductDialog;
