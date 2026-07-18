import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateBrand } from "../../helpers/updateBrand";
import { createBrand } from "../../helpers/createBrand";
import { X } from "lucide-react";

const AddBrandCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    newly_launched: false,
    image: null,
    imagePreview: null,
  });

  // 🌟 Pre-fill form for editing
  useEffect(() => {
    if (isEditMode && initialData) {
      const imageURL =
        Array.isArray(initialData.images) && initialData.images.length > 0
          ? initialData.images[0]
          : null;

      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        newly_launched: initialData.newly_launched || false,
        image: null,
        imagePreview: imageURL,
      });
    }
  }, [initialData, isEditMode]);
  

  // 🔄 Mutation: Create or Update
  const mutation = useMutation({
    mutationFn: (form) =>
      isEditMode
        ? updateBrand({ id: initialData._id, payload: form })
        : createBrand(form),
  
        onSuccess: (data) => {
            if (data.success) {
            toast.success(`Brand ${isEditMode ? "updated" : "created"} successfully!`);
            navigate("/dashboard/brands");
          } else {
            toast.error(data.message || "Operation failed");
          }
        },
  
    onError: (error) => {
        if (error?.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((errMsg) => {
          toast.error(errMsg);
        });
        return;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save brand";
  
      toast.error(message);
    },
  });
  

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png"];
      const maxSize = 2 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, files are allowed.");
        return;
      }

      if (file.size > maxSize) {
        toast.error("Image size must be under 2MB.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
  };

  // 🚀 Submit form
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Brand description is required");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("newly_launched", formData.newly_launched);

    if (formData.image) {
      form.append("images", formData.image);
    }

    mutation.mutate(form);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="bg-card shadow-elegant-sm mx-auto w-full max-w-6xl space-y-6 rounded-xl border p-10"
    >
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Brand Name"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brand Description"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label>Newly Launched</Label>
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

      <div className="space-y-2">
        <Label>Brand Image</Label>
        <Input type="file" accept="image/*" onChange={handleImageChange} />
        {formData.imagePreview && (
          <div className="border-border relative mt-2 overflow-hidden rounded-lg border">
            <img
              src={formData.imagePreview}
              alt="Brand Preview"
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="bg-destructive text-destructive-foreground shadow-elegant-sm absolute top-2 right-2 rounded-full p-1 transition-opacity hover:opacity-90"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={mutation.isLoading}>
          {mutation.isLoading ? (
            <span className="flex items-center gap-2">
              <span className="border-primary-foreground/40 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
              {isEditMode ? "Updating..." : "Submitting..."}
            </span>
          ) : isEditMode ? "Update Brand" : "Create Brand"}
        </Button>
      </div>
    </form>
  );
};

export default AddBrandCard;
