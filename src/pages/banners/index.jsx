import { useState } from "react";
import { useNavigate } from "react-router";
import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BannersTable from "./components/BannersTable";

const Banners = () => {
  const navigate = useNavigate();
  const [bannersLength, setBannersLength] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [params, setParams] = useState({
    page: 1,
    per_page: 50,
  });

  const onAdd = () => {
    navigate("/dashboard/banners/add");
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

  const breadcrumbs = [{ title: "Banners", isNavigation: true }];

  return (
    <div className="flex flex-col">
      <NavbarItem title="Banners" breadcrumbs={breadcrumbs} />

      <div className="px-4">
        <CustomActionMenu
          title="Banners"
          total={bannersLength}
          onAdd={onAdd}
          disableBulkUpload={true}
          disableSearch={true}
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
        <BannersTable
          setBannersLength={setBannersLength}
          params={params}
          setParams={setParams}
        />
      </div>
    </div>
  );
};

export default Banners;
