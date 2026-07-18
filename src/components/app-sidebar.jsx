import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Input } from "./ui/input";
import { data } from "@/utils/sidebar/sidebarData";
import { filterItemsByRole } from "@/utils/sidebar/filterItemsByRole";
import { useEffect, useState } from "react";
import { getItem } from "@/utils/local_storage";
import { X } from "lucide-react";

export function AppSidebar({ ...props }) {
  
  const userInfo = data.user;
  const [role, setRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedRole = getItem("userRole");
    if (storedRole === "super_admin" || storedRole === "admin") {
      setRole(storedRole);
    }
  }, []);
  
  const userInfoWithRole = { ...data.user, role };
  const filterBySearch = (items, query) =>
    items
      .map((item) => {
        const title = item.title || item.label; // fallback if some items use 'label'
        const matchesTitle = title?.toLowerCase().includes(query.toLowerCase());
  
        if (Array.isArray(item.items)) {
          const filteredSub = filterBySearch(item.items, query);
          if (matchesTitle || filteredSub.length > 0) {
            return { ...item, items: filteredSub };
          }
          return null;
        }
  
        if (matchesTitle) return item;
        return null;
      })
      .filter(Boolean);
  

  const filteredNavMain = filterBySearch(filterItemsByRole(data.navMain, role), searchQuery);
  const filteredProjectMain = filterBySearch(filterItemsByRole(data.projects, role), searchQuery);
  const filteredManagementMain = filterBySearch(filterItemsByRole(data.management, role), searchQuery);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <div className="relative">
          <Input
            placeholder="Search"
            className="bg-background pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </SidebarHeader>
     <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:hidden">
  {filteredNavMain.length > 0 && (
    <NavMain items={filteredNavMain} showHeader={false} />
  )}

  {filteredProjectMain.length > 0 && (
    <NavMain items={filteredProjectMain} showHeader={true} header={"More"} />
  )}

  {filteredManagementMain.length > 0 && (
    <NavMain items={filteredManagementMain} showHeader={true} header={"Management"} />
  )}
</SidebarContent>
      <SidebarFooter>
      <NavUser user={userInfoWithRole} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
