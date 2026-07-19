import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import NavbarItem from "@/components/navbar/navbar_item";
import Typography from "@/components/typography";
import { Input } from "@/components/ui/input";
import MovementsTable from "../MovementsTable";

const StockHistory = () => {
  const [skuFilter, setSkuFilter] = useState("");
  const debouncedSku = useDebounce(skuFilter, 500);

  const breadcrumbs = [
    { title: "Inventory", path: "/dashboard/inventory", isNavigation: true },
    { title: "Stock History", isNavigation: false },
  ];

  return (
    <div className="flex flex-col">
      <NavbarItem title="Stock History" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Typography variant="p" className="text-muted-foreground">
            Global audit log of every stock movement across all SKUs.
          </Typography>
          <Input
            placeholder="Filter by SKU"
            className="w-full sm:w-64"
            value={skuFilter}
            onChange={(e) => setSkuFilter(e.target.value)}
          />
        </div>

        <MovementsTable sku={debouncedSku || undefined} showSkuColumn perPage={20} />
      </div>
    </div>
  );
};

export default StockHistory;
