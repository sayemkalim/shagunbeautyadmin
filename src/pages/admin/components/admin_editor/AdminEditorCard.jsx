import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Typography from "@/components/typography";
import { createAdmin } from "../../helpers/createAdmin";
import { updateAdmin } from "../../helpers/updateAdmin";

const AdminEditorCard = ({ initialData, isEdit }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    is_active: false,
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        password: "", // Don't pre-fill password for security
        role: initialData.role || "admin",
        is_active: initialData.is_active || false,
      });
    }
  }, [isEdit, initialData]);

  const createMutation = useMutation({
    mutationFn: (formData) => createAdmin(formData),
    onSuccess: () => {
      toast.success("Admin created successfully!");
      navigate("/dashboard/admins");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateAdmin({ payload, id }),
    onSuccess: () => {
      toast.success("Admin updated successfully!");
      navigate("/dashboard/admins");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update admin");
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    const { name, email, password, role, is_active } = formData;

    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // For new admin, password is required
    if (!isEdit && !password.trim()) {
      toast.error("Password is required for new admin");
      return;
    }

    const payload = {
      name,
      email,
      role,
      is_active,
    };

    // Only include password if provided (for edit) or if it's a new admin
    if (password.trim()) {
      payload.password = password;
    }

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="bg-card mx-auto w-full max-w-6xl space-y-6 rounded-xl border p-10 shadow-elegant-sm">
      <Typography variant="h3" className="mb-4">
        {isEdit ? "Edit Admin" : "Add Admin"}
      </Typography>

      {/* Name */}
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full Name"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin@example.com"
        />
      </div>

      {/* Password */}
      <div className="space-y-2 relative">
        <Label>
          Password {isEdit && "(Leave blank to keep current password)"}
        </Label>
        <Input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={isEdit ? "Enter new password" : "Password"}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-muted-foreground hover:text-foreground absolute top-[38px] right-3 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label>Role</Label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-30 border-input bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm"
          disabled
        >
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Is Active */}
      <div className="flex items-center space-x-2">
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
        <Label htmlFor="is_active">Active</Label>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
            ? "Update Admin"
            : "Create Admin"}
        </Button>
      </div>
    </div>
  );
};

export default AdminEditorCard; 