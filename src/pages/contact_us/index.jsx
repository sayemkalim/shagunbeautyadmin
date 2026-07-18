import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import { useEffect, useState } from "react";
import ContactUsTable from "./components/ContactUsTable";
import { useDebounce } from "@uidotdev/usehooks";

const ContactUs = () => {
  const paramInitialState = {
    page: 1,
    per_page: 50,
    search: "",
  };

  const [contactUsLength, setContactUsLength] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState(paramInitialState);
  const [openBulkExportDialog, setOpenBulkExportDialog] = useState(false);
  const debouncedSearch = useDebounce(searchText, 500);

  const breadcrumbs = [{ title: "Blogs", isNavigation: false }];

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const onRowsPerPageChange = (value) => {
    setParams((prev) => ({
      ...prev,
      per_page: value,
    }));
  };

  const handleDateRangeChange = (range) => {
    if (!range || !range.from || !range.to) {
      setParams((prev) => {
        if (prev.start_date === undefined && prev.end_date === undefined) {
          return prev;
        }
        return { ...prev, start_date: undefined, end_date: undefined };
      });
      return;
    }

    setParams((prev) => {
      const isSame =
        prev.start_date?.toString() === range.from.toString() &&
        prev.end_date?.toString() === range.to.toString();

      if (isSame) return prev;

      return { ...prev, start_date: range.from, end_date: range.to };
    });
  };
  const onOpenBulkExportDialog = () => {
    setOpenBulkExportDialog(true);
  };

  const onCloseBulkExportDialog = () => {
    setOpenBulkExportDialog(false);
  };
  useEffect(() => {
    if (params.search !== debouncedSearch) {
      setParams((prev) => ({
        ...prev,
        search: debouncedSearch,
      }));
    }
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col">
      <NavbarItem title="Contact Us" breadcrumbs={breadcrumbs} />

      <div className="px-4">
        <CustomActionMenu
          title="Contact us"
          total={contactUsLength}
          disableAdd={true}
          searchText={searchText}
          handleSearch={handleSearch}
          showDateRangePicker={true}
          handleDateRangeChange={handleDateRangeChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          onRowsPerPageChange={onRowsPerPageChange}
          disableBulkExport={false}
          onBulkExport={onOpenBulkExportDialog}
        />
        <ContactUsTable
          setContactUsLength={setContactUsLength}
          params={params}
          setParams={setParams}
        />
          {/* <ExportCategoryDialog
          openDialog={openBulkExportDialog}
          onClose={onCloseBulkExportDialog}
          params={params}
        /> */}
      </div>
    </div>
  );
};

export default ContactUs;
