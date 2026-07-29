import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CouponsTable from "./components/CouponsTable";

const Coupons = () => {
  const navigate = useNavigate();
  const [couponsLength, setCouponsLength] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [params, setParams] = useState({
    page: 1,
    per_page: 50,
    search: "",
    sort: "latest",
  });

  const debouncedSearch = useDebounce(searchText, 500);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const onAdd = () => {
    navigate("/dashboard/coupons/add");
  };

  const onRowsPerPageChange = (newRowsPerPage) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRowsPerPage,
      page: 1,
    }));
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setParams((prev) => ({
      ...prev,
      is_active: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const breadcrumbs = [{ title: "Coupons", isNavigation: true }];

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      search: debouncedSearch,
      page: 1,
    }));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col">
      <NavbarItem title="Coupons" breadcrumbs={breadcrumbs} />

      <div className="px-4">
        <CustomActionMenu
          title="Coupons"
          total={couponsLength}
          onAdd={onAdd}
          searchText={searchText}
          handleSearch={handleSearch}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          filters={
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <CouponsTable
          setCouponsLength={setCouponsLength}
          params={params}
          setParams={setParams}
        />
      </div>
    </div>
  );
};

export default Coupons;
