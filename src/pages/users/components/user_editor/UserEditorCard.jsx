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
import { createUser } from "../../helpers/createUser";
import { updateUser } from "../../helpers/updateUser";

const UserEditorCard = ({ initialData, isEdit }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    // isActive removed
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        password: "", // Don't pre-fill password for security
        // isActive removed
      });
    }
  }, [isEdit, initialData]);

  const createMutation = useMutation({
    mutationFn: (formData) => createUser(formData),
    onSuccess: () => {
      toast.success("User created successfully!");
      navigate("/dashboard/users");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateUser({ payload, id }),
    onSuccess: () => {
      toast.success("User updated successfully!");
      navigate("/dashboard/users");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update user");
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
    const { name, email, phone, password } = formData;

    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // For new user, password is required
    if (!isEdit && !password.trim()) {
      toast.error("Password is required for new user");
      return;
    }

    const payload = {
      name,
      email,
      phone,
    };

    // Only include password if provided (for edit) or if it's a new user
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
        {isEdit ? "Edit User" : "Add User"}
      </Typography>

      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
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
          placeholder="user@example.com"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label>Phone Number</Label>
        <Input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1234567890"
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

      {/* isActive field removed */}

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
            ? "Update User"
            : "Create User"}
        </Button>
      </div>
    </div>
  );
};

export default UserEditorCard; 