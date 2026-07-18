import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { X } from "lucide-react";
import { createBlog } from "../../helpers/createBlog";
import { updateBlog } from "../../helpers/updateBlog";
import TextEditor from "@/components/text_editor";
import { Checkbox } from "@/components/ui/checkbox";

const AddBlogCard = ({ isEdit = false, initialData = null }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    short_description: "",
    content: "",
    bannerImage: null,
    bannerPreview: null,
    published: false,
    isFeatured: false,
    
  });

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        title: initialData.title || "",
        short_description: initialData.short_description || "",
        content: initialData.content || "",
        bannerImage: null,
        bannerPreview: initialData.bannerImageUrl || null,
        published: initialData.published || false,
        isFeatured: initialData.isFeatured || false,
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        bannerImage: file,
        bannerPreview: URL.createObjectURL(file),
      }));
    }
  };

  const resetBanner = () => {
    setFormData((prev) => ({
      ...prev,
      bannerImage: null,
      bannerPreview: null,
    }));
  };

  const createMutation = useMutation({
    mutationFn: createBlog,
    onSuccess: (res) => {
        if (res?.response?.success) {
          toast.success(`Blog ${isEdit ? "updated" : "created"} successfully`);
          navigate("/dashboard/blogs");
        } else {
          toast.error(res?.response?.message || "Failed to create blog");
        }
      },
      onError: () => {
        toast.error(`Failed to ${isEdit ? "update" : "create"} blog`);
      },
    });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateBlog({ id, payload }),
    onSuccess: () => {
      toast.success("Blog updated successfully");
      navigate("/dashboard/blogs");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update blog");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", formData.title);
    form.append("short_description", formData.short_description);
    form.append("content", formData.content);
    form.append("published", formData.published);
    form.append("is_featured", formData.isFeatured);
  
    if (formData.bannerImage instanceof File) {
        form.append("banner_image_url", formData.bannerImage); // <- FIXED
      }
  
    if (isEdit) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };
  

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card shadow-elegant-sm mx-auto max-w-6xl space-y-6 rounded-xl border p-8"
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Title</label>
        <Input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Blog title"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Short Description</label>
        <Input
          name="short_description"
          value={formData.short_description}
          onChange={handleChange}
          placeholder="Short summary"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Banner Image</label>
        {formData.bannerPreview ? (
          <div className="group border-input relative overflow-hidden rounded-lg border">
            <img
              src={formData.bannerPreview}
              alt="Preview"
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={resetBanner}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute top-2 right-2 rounded-full p-1.5 shadow-elegant-sm transition-colors"
              aria-label="Remove banner image"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="bannerImage"
            className="border-input hover:border-primary/50 hover:bg-accent/40 flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors"
          >
            <span className="text-muted-foreground text-sm">Click to upload a banner image</span>
            <span className="text-muted-foreground/70 text-xs">PNG, JPG up to a few MB</span>
          </label>
        )}
        <Input
          id="bannerImage"
          type="file"
          accept="image/*"
          onChange={handleBannerImageChange}
          className={formData.bannerPreview ? "mt-3" : "hidden"}
        />
      </div>

      <div className="bg-muted/40 flex flex-wrap items-center gap-6 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="published"
            checked={formData.published}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, published: !!checked }))
            }
          />
          <label htmlFor="published" className="text-sm font-medium">
            Published
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isFeatured: !!checked }))
            }
          />
          <label htmlFor="isFeatured" className="text-sm font-medium">
            Featured
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Content</label>
        <div className="border-input overflow-hidden rounded-lg border">
          <TextEditor
            value={formData.content}
            onTextChange={(newContent) =>
              setFormData((prev) => ({ ...prev, content: newContent }))
            }
            placeholder="Blog content..."
            height={400}
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? isEdit
            ? "Updating..."
            : "Creating..."
          : isEdit
          ? "Update Blog"
          : "Create Blog"}
      </Button>
    </form>
  );
};

export default AddBlogCard;
