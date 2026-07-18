import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { endpoints } from "@/api/endpoints";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/api/api_service/apiService";
import { setToken } from "@/utils/auth";
import { setItem } from "@/utils/local_storage";
import { Mail, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
export function LoginForm() {
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (data) =>
      apiService({
        endpoint: endpoints.login,
        method: "POST",
        data,
        removeToken: true,
      }),
      onSuccess: (data) => {
        const userData = data?.response?.data;

        if (!userData?.token) {
          toast.error(userData?.message || "Login failed: No token received.");
          return;
        }

        setToken(userData.token);
      
        setItem({
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          userRole: userData.role,      
          });
      
        toast.success("Logged in successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      },
      
      
    onError: (error) => {
      toast.error("Invalid email or password");
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
          <ShieldCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Sign in to the admin dashboard to continue
          </p>
        </div>
      </div>
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              size={16}
            />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              size={16}
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              className="pr-9 pl-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-1 w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
