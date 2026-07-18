import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChevronLeft } from "lucide-react";

const NavbarItem = ({ title, isBack }) => {
  return (
    <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex flex-col justify-between gap-4 border-b p-4 backdrop-blur-md md:flex-row md:items-center">
      <div className="mb-4 flex flex-row gap-6 md:mb-0">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-xl">{title}</h1>
          <NavbarBreadcrumb title={title} isBack={isBack} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default NavbarItem;

export const NavbarBreadcrumb = ({ title, isBack }) => {
  return (
    <header className="flex shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-6">
      {isBack && (
        <ChevronLeft
          className="hover:bg-accent hover:text-accent-foreground h-5 w-5 rounded-full transition-colors hover:cursor-pointer"
          onClick={() => history.back()}
        />
      )}
      <div className="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};
