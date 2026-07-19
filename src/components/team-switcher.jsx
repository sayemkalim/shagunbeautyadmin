import { useEffect, useState } from "react";
import { Crown, ShieldUserIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getItem } from "@/utils/local_storage";

export function TeamSwitcher() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = getItem("userRole");
    console.log("📥 Retrieved role from localStorage:", storedRole);
    setRole(storedRole);
  }, []);

  const isSuperAdmin = role === "super_admin";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant-sm flex aspect-square size-8 items-center justify-center rounded-lg">
            {isSuperAdmin ? (
              <Crown className="size-4" />
            ) : (
              <ShieldUserIcon className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Shagun Beauty</span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
