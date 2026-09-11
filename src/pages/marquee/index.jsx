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
import MarqueeTable from "./components/MarqueeTable";

const Marquee = () => {
  const navigate = useNavigate();
  const [marqueesLength, setMarqueesLength] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [params, setParams] = useState({
    page: 1,
    per_page: 50,
  });

  const onAdd = () => {
    navigate("/dashboard/marquee/add");
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

  const breadcrumbs = [{ title: "Marquee", isNavigation: true }];

  return (
    <div className="flex flex-col">
      <NavbarItem title="Marquee" breadcrumbs={breadcrumbs} />

      <div className="px-4">
        <CustomActionMenu
          title="Marquee"
          total={marqueesLength}
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
        <MarqueeTable
          setMarqueesLength={setMarqueesLength}
          params={params}
          setParams={setParams}
        />
      </div>
    </div>
  );
};

export default Marquee;
