import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@uidotdev/usehooks";
import { History, RefreshCw } from "lucide-react";
import NavbarItem from "@/components/navbar/navbar_item";
import CustomActionMenu from "@/components/custom_action";
import { Button } from "@/components/ui/button";
import { getItem } from "@/utils/local_storage";
import InventoryStatsCards from "./components/InventoryStatsCards";
import InventoryFilterTabs from "./components/InventoryFilterTabs";
import InventoryTable from "./components/InventoryTable";
import SyncInventoryDialog from "./components/SyncInventoryDialog";

const Inventory = () => {
  const navigate = useNavigate();
  const role = getItem("userRole");
  const canMutate = role === "admin" || role === "super_admin";

  const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState({ page: 1, per_page: 50, search: "", filter: "all" });
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(searchText, 500);
  const breadcrumbs = [{ title: "Inventory", isNavigation: false }];

  useEffect(() => {
    if (params.search !== debouncedSearch) {
      setParams((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, params.search]);

  const handleSearch = (e) => setSearchText(e.target.value);

  const handleFilterChange = (filter) => {
    setParams((prev) => ({ ...prev, filter, page: 1 }));
  };

  const onRowsPerPageChange = (perPage) => {
    setParams((prev) => ({ ...prev, per_page: perPage, page: 1 }));
  };

  return (
    <div className="flex flex-col">
      <NavbarItem title="Inventory Management" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4 p-4">
        <InventoryStatsCards />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <InventoryFilterTabs value={params.filter} onChange={handleFilterChange} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/dashboard/inventory/stock-history")}
            >
              <History className="size-4" />
              Stock History
            </Button>
            {canMutate && (
              <Button variant="outline" className="gap-2" onClick={() => setSyncDialogOpen(true)}>
                <RefreshCw className="size-4" />
                Sync from Products
              </Button>
            )}
          </div>
        </div>

        <CustomActionMenu
          title="Inventory"
          total={totalCount}
          disableAdd
          searchText={searchText}
          handleSearch={handleSearch}
          showRowSelection
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPage={params.per_page}
        />

        <InventoryTable
          params={params}
          setParams={setParams}
          onOpenSync={() => setSyncDialogOpen(true)}
          setTotal={setTotalCount}
        />
      </div>

      <SyncInventoryDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} />
    </div>
  );
};

export default Inventory;
