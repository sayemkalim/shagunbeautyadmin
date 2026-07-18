import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import { DateRangePicker } from "@/components/date_filter";
import CategoryTable from "./components/CategoryTable";
import ExportCategoryDialog from "./components/ExportCategoryDialog";


const Categories = () => {
  const navigate = useNavigate();
  const [openBulkExportDialog, setOpenBulkExportDialog] = useState(false);
  const [categoryLength, setCategoryLength] = useState(0);
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
    navigate("/dashboard/category/add"); 
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

  const breadcrumbs = [{ title: "Categories", isNavigation: true }];



  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col">
      <NavbarItem
        title="Categories"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-4">
        <CustomActionMenu
          title="categories"
          total={categoryLength}
          onAdd={onAdd}
          searchText={searchText}
          handleSearch={handleSearch}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          disableBulkExport={false}
          onBulkExport={onOpenBulkExportDialog}
        />
       
        <CategoryTable
  setCategoryLength={setCategoryLength}
         params={params}
       setParams={setParams}
        />
         <ExportCategoryDialog
          openDialog={openBulkExportDialog}
          onClose={onCloseBulkExportDialog}
          params={params}
        />
      </div>
    </div>
  );
};

export default Categories;
