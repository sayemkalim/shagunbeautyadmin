import React from "react";
import Typography from "../typography";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { CloudDownload, CloudUpload, PlusIcon, SlidersHorizontal } from "lucide-react";
import { singularize } from "@/utils/singularizing_word";
import { capitalize } from "@/utils/captilize";
import { DateRangePicker } from "../date_filter";
import SelectRowsPerPage from "../select_rows_per_page";

const CustomActionMenu = ({
  title,
  total,
  onAdd,
  handleSearch,
  disableAdd = false,
  disableBulkUpload = true,
  disableSearch = false,
  searchText,
  setOpenDialog,
  showDateRangePicker = false,
  handleDateRangeChange,
  showRowSelection = false,
  onRowsPerPageChange,
  rowsPerPage = 25,
  disableBulkExport = true,
  onBulkExport,
  bulkExportLabel = "Bulk Export",
  filters,
}) => {
  const hasFilters =
    showDateRangePicker || showRowSelection || Boolean(filters) || !disableBulkExport;

  return (
    <div className="my-3 flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <Typography variant="p" className="whitespace-nowrap">
          Showing {total} {title}
        </Typography>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {!disableSearch && (
          <Input
            placeholder="Search"
            className={`min-w-[150px] ${disableBulkUpload ? "w-80" : "w-48"}`}
            value={searchText}
            onChange={handleSearch}
          />
        )}

        {hasFilters && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="size-4" />
                <span>Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters &amp; options</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
                {showDateRangePicker && (
                  <div className="flex flex-col gap-2">
                    <Typography variant="small" className="text-muted-foreground font-medium">
                      Date range
                    </Typography>
                    <DateRangePicker onChange={handleDateRangeChange} className="w-full" />
                  </div>
                )}

                {filters && (
                  <div className="flex flex-col gap-2">
                    <Typography variant="small" className="text-muted-foreground font-medium">
                      Status
                    </Typography>
                    {filters}
                  </div>
                )}

                {showRowSelection && (
                  <div className="flex flex-col gap-2">
                    <Typography variant="small" className="text-muted-foreground font-medium">
                      Rows per page
                    </Typography>
                    <SelectRowsPerPage
                      onRowsPerPageChange={onRowsPerPageChange}
                      rowsPerPage={rowsPerPage}
                    />
                  </div>
                )}
              </div>

              {!disableBulkExport && (
                <SheetFooter>
                  <Button onClick={onBulkExport} className="w-full gap-2">
                    <CloudDownload className="size-4" />
                    <span>{bulkExportLabel}</span>
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full">
                      Done
                    </Button>
                  </SheetClose>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        )}

        {!disableBulkUpload && (
          <Button
            onClick={() => setOpenDialog(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <CloudUpload />
            <span>Bulk Upload</span>
          </Button>
        )}
        {!disableAdd && (
          <Button
            onClick={onAdd}
            className="flex items-center gap-2 cursor-pointer"
          >
            <PlusIcon />
            <span>Add {capitalize(singularize(title))}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CustomActionMenu;
