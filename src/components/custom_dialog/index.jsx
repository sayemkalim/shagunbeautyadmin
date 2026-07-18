import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export function CustomDialog({
  onOpen,
  onClose,
  title,
  buttonText,
  modalType,
  onDelete,
  id,
  isLoading,
}) {
  const isDestructive = modalType === "Delete";

  return (
    <Dialog open={onOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {isDestructive && (
            <div className="bg-destructive/10 text-destructive mb-1 flex size-10 items-center justify-center rounded-full">
              <AlertTriangle className="size-5" />
            </div>
          )}
          <DialogTitle>{modalType}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {title}? <br /> This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={isLoading}
            onClick={() => onDelete(id)}
            variant={isDestructive ? "destructive" : "default"}
            type="submit"
          >
            {isLoading ? "Please wait..." : modalType || buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
