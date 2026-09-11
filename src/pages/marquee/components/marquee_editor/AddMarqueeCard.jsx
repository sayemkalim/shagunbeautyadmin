import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoveRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateMarquee } from "../../helpers/updateMarquee";
import { createMarquee } from "../../helpers/createMarquee";

const AddMarqueeCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    text: "",
    is_active: true,
  });

  // Pre-fill form for editing
  useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {
      setFormData({
        text: initialData.text || "",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    }
  }, [initialData, isEditMode]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      return isEditMode
        ? await updateMarquee({ id: initialData._id, data: payload })
        : await createMarquee(payload);
    },

    onSuccess: (data) => {
      const isSuccess = data?.response?.success || data?.success;

      if (isSuccess) {
        toast.success(`Marquee ${isEditMode ? "updated" : "created"} successfully!`);
        navigate("/dashboard/marquee");
        return;
      }

      const message =
        data?.response?.data?.message ||
        data?.response?.message ||
        data?.message ||
        "Failed to save marquee";
      toast.error(message);
    },

    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save marquee";
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (!formData.text.trim()) {
      toast.error("Marquee text is required");
      return;
    }

    const payload = {
      text: formData.text.trim(),
      is_active: formData.is_active,
    };

    mutation.mutate(payload);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="bg-card shadow-elegant-sm mx-auto w-full max-w-2xl space-y-6 rounded-xl border p-8"
    >
      {/* Text Input */}
      <div className="space-y-2">
        <Label htmlFor="marquee-text" className="text-sm font-medium">
          Marquee Text <span className="text-destructive">*</span>
        </Label>
        <Input
          id="marquee-text"
          type="text"
          value={formData.text}
          onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
          placeholder="e.g. SUPER FESTIVE SALE • SALE IS LIVE"
          className="text-base"
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Enter the announcement text to display on the storefront/app.
        </p>
      </div>

      {/* Active Checkbox */}
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              is_active: !!checked,
            }))
          }
        />
        <Label htmlFor="is_active" className="cursor-pointer font-medium text-sm">
          Active (Visible on app & storefront)
        </Label>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2"
          disabled={mutation.isPending || mutation.isLoading}
        >
          {mutation.isPending || mutation.isLoading ? (
            <span className="flex items-center gap-2">
              <span className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              {isEditMode ? "Updating Marquee..." : "Creating Marquee..."}
            </span>
          ) : (
            <>
              <span>{isEditMode ? "Update Marquee" : "Create Marquee"}</span>
              <MoveRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddMarqueeCard;
