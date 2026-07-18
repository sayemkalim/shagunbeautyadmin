import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Typography from "@/components/typography";
import NavbarItem from "@/components/navbar/navbar_item";
import { createAdmin } from "../helpers/createAdmin";

const AddSuperAdminCard = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "super-admin",
    is_active: false,
  });
  const mutation = useMutation({
    mutationFn: async (payload) => {
      return await createAdmin(payload);
    },
    onSuccess: (data) => {
      toast.success(data.message || "Admin created successfully!");
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
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

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Full name, email, and password are required");
      return;
    }

    const payload = {
      name,
      email,
      password,
      role,
      is_active,
    };

    mutation.mutate(payload);
  };

  return (
    <>
      <NavbarItem
        title="Add Super Admin"
        breadcrumbs={[{ title: "Add Super Admin", isNavigation: false }]}
      />

      <div className="bg-card mx-auto w-full max-w-6xl space-y-6 rounded-xl border p-10 shadow-elegant-sm">
        <Typography variant="h3">Add Super Admin</Typography>

        {/* Name */}
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
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
          <Label>Password</Label>
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
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
            disabled
            className="border-input bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm"
          >
            <option value="admin">Super Admin</option>
          </select>
        </div>

        {/* Active */}
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
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? "Submitting..." : "Create Super-Admin"}
        </Button>
      </div>
    </>
  );
};

export default AddSuperAdminCard;
