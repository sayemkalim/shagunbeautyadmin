import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import { DateRangePicker } from "@/components/date_filter";
import AdminsTable from "./components/AdminsTable";
// import ExportCategoryDialog from "./components/ExportCategoryDialog";


const Admin = () => {
  const navigate = useNavigate();
  const [openBulkExportDialog, setOpenBulkExportDialog] = useState(false);
  const [adminsLength, setAdminsLength] = useState(0);
    const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState({
    page: 1,
    per_page: 25,
    search: "",
    start_date: undefined,
    end_date: undefined,
  });

  const debouncedSearch = useDebounce(searchText, 500);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const onAdd = () => {
    navigate("/dashboard/admins/add"); 
  };

  const onRowsPerPageChange = (newRowsPerPage) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRowsPerPage,
    }));
  };
  const onOpenBulkExportDialog = () => {
    setOpenBulkExportDialog(true);
  };

  const onCloseBulkExportDialog = () => {
    setOpenBulkExportDialog(false);
  };

  const breadcrumbs = [{ title: "Admins", isNavigation: true }];



  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col">
      <NavbarItem
        title="Admins"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-4">
        <CustomActionMenu
          title="Admin"
          total={adminsLength}
          onAdd={onAdd}
          searchText={searchText}
          handleSearch={handleSearch}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          disableBulkExport={false}
          onBulkExport={onOpenBulkExportDialog}
        />
         <AdminsTable setadminsLength={setAdminsLength} params={params} setParams={setParams} />
        
         {/* <ExportCategoryDialog
          openDialog={openBulkExportDialog}
          onClose={onCloseBulkExportDialog}
          params={params}
        />  */}
      </div>
    </div>
  );
};

export default Admin;
