import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { CompassIcon, ArrowLeft } from "lucide-react";

const ErrorPage = () => {
  const navigate = useNavigate();

  const onNavigateHome = () => {
    navigate("/");
  };

  const onNavigateBack = () => {
    navigate(-1);
  };

  return (
    <section className="bg-background flex min-h-screen items-center">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center px-6 py-12 text-center">
        <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl">
          <CompassIcon className="size-7" />
        </div>
        <p className="text-primary mt-6 text-sm font-semibold tracking-wide">404</p>
        <h1 className="text-foreground mt-2 text-2xl font-semibold md:text-3xl">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-3">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="mt-8 flex w-full items-center gap-3 sm:w-auto">
          <Button variant="outline" onClick={onNavigateBack} className="w-1/2 gap-2 sm:w-auto">
            <ArrowLeft className="size-4" />
            Go back
          </Button>
          <Button onClick={onNavigateHome} className="w-1/2 sm:w-auto">
            Take me home
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;
