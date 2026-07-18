import { LoginForm } from "@/components/login-form";
import celiacLogo from "@/assets/celiac_logo.png";

const Login = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center gap-2 lg:hidden">
          <img src={celiacLogo} alt="The Celiac Store" className="h-8 w-auto object-contain" />
          <span className="font-semibold tracking-tight">The Celiac Store</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="bg-card rounded-2xl border p-8 shadow-elegant-lg">
              <LoginForm />
            </div>
            <p className="text-muted-foreground mt-6 text-center text-xs">
              &copy; {new Date().getFullYear()} The Celiac Store. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="from-primary via-primary relative hidden overflow-hidden bg-gradient-to-br to-[#3d0870] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="bg-noise absolute inset-0 opacity-40" />
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, white, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, white, transparent 70%)" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/20">
            <img
              src={celiacLogo}
              alt="Celiac Logo"
              className="max-h-40 max-w-64 object-contain drop-shadow-xl"
            />
          </div>
          <div className="max-w-md space-y-3">
            <h2 className="text-2xl font-semibold text-white">
              Run your store with clarity
            </h2>
            <p className="text-sm text-white/70">
              Manage products, orders, and customers from a single, focused admin
              workspace built for The Celiac Store team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
