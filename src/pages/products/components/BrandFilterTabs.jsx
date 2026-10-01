import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchBrand } from "@/pages/brands/helpers/fetchBrand";

const BrandFilterTabs = ({ selectedBrand = "all", onSelectBrand }) => {
  const { data: apiBrandsResponse } = useQuery({
    queryKey: ["brands-filter-list"],
    queryFn: () => fetchBrand({ params: {} }),
    select: (data) => data?.response?.data || data?.data || data,
  });

  const brands = Array.isArray(apiBrandsResponse?.brands)
    ? apiBrandsResponse.brands
    : Array.isArray(apiBrandsResponse)
    ? apiBrandsResponse
    : [];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 py-1 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Tag className="size-3.5" /> Brands:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectBrand("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border",
              selectedBrand === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border-border"
            )}
          >
            All Brands
          </button>

          {brands.map((b) => {
            const isSelected = selectedBrand === b._id || selectedBrand === b.name;
            return (
              <button
                key={b._id}
                type="button"
                onClick={() => onSelectBrand(b._id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border"
                )}
              >
                {b.logo && (
                  <img
                    src={b.logo}
                    alt={b.name}
                    className="size-3.5 rounded-full object-contain bg-white/80 shrink-0"
                  />
                )}
                <span>{b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {brands.length > 5 && (
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <select
            value={selectedBrand}
            onChange={(e) => onSelectBrand(e.target.value)}
            className="border-input bg-background text-foreground text-xs rounded-md border px-2.5 py-1 shadow-sm outline-none cursor-pointer"
          >
            <option value="all">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default BrandFilterTabs;
