import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Typography from "@/components/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { createCategory } from "../../helpers/createProduct";
import { updateCategory } from "../../helpers/updateCategory";

const AddCategoryCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_label_text: "",
    newly_launched: false,
    images: [],
    imagePreviews: [],
  });

  // Load initial data for edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        discount_label_text: initialData.discount_label_text || "",
        newly_launched: initialData.newly_launched || false,
        images: [],
        imagePreviews: Array.isArray(initialData.images)
          ? initialData.images.map((imgUrl) => ({
              file: null,
              preview: imgUrl,
              isFromServer: true,
            }))
          : [],
      });
    }
  }, [isEditMode, initialData]);

  // Create category
  const createMutation = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      toast.success("Category created successfully!");
      navigate("/dashboard/categories");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create category";

      toast.error(message);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCategory({ id, payload }),
    onSuccess: (res) => {
      if (res?.response?.success) {
        toast.success("Category updated successfully!");
        navigate("/dashboard/categories");
      } else {
        toast.error(
          res?.response?.data?.message || "Failed to update category"
        );
      }
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [...prev.imagePreviews, ...previews],
    }));
  };

  const handleImageRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    const { name, description, discount_label_text } = formData;

    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!discount_label_text.trim()) {
      toast.error("Discount label text is required");
      return;
    }

    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("discount_label_text", discount_label_text);
    form.append("newly_launched", formData.newly_launched);

    // Append images if selected
    formData.images.forEach((file) => {
      if (file instanceof File) {
        form.append("images", file);
      }
    });

    if (isEditMode) {
      editMutation.mutate({ id: initialData._id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  useEffect(() => {
    return () => {
      formData.imagePreviews.forEach((img) => {
        if (!img.isFromServer) URL.revokeObjectURL(img.preview);
      });
    };
  }, [formData.imagePreviews]);

  return (
    <>
      <div className="bg-card shadow-elegant-sm mx-auto w-full max-w-6xl space-y-6 rounded-xl border p-10">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Category Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Category Description"
          />
        </div>

        <div className="space-y-2">
          <Label>Discount Label Text</Label>
          <Input
            type="text"
            name="discount_label_text"
            value={formData.discount_label_text}
            onChange={handleChange}
            placeholder="E.g., 'Up to 50% Off'"
          />
        </div>

        {/* Image upload */}
        <div className="space-y-2">
          <Label>Category Images</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {formData.imagePreviews.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {formData.imagePreviews.map((img, index) => (
                <div
                  key={index}
                  className="bg-muted border-border group relative h-32 w-32 overflow-hidden rounded-lg border"
                >
                  <img
                    src={img.preview}
                    alt={`Preview ${index}`}
                    className="h-full w-full object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="bg-destructive text-destructive-foreground shadow-elegant-sm absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    title="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="newly_launched">Newly Launched</Label>
          <Checkbox
            id="newly_launched"
            checked={formData.newly_launched}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                newly_launched: !!checked,
              }))
            }
          />
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createMutation.isPending || editMutation.isPending}
          >
            {createMutation.isPending || editMutation.isPending
              ? isEditMode
                ? "Updating..."
                : "Adding..."
              : isEditMode
              ? "Update Category"
              : "Add Category"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AddCategoryCard;
