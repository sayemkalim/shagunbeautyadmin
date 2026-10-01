import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import { fetchBrand } from "@/pages/brands/helpers/fetchBrand";

const BrandDropdown = ({ selectedBrand = "all", onSelectBrand }) => {
  const { data: apiBrandsResponse, isLoading } = useQuery({
    queryKey: ["brands-filter-list"],
    queryFn: () => fetchBrand({ params: {} }),
    select: (data) => data?.response?.data || data?.data || data,
  });

  const rawBrands = Array.isArray(apiBrandsResponse?.brands)
    ? apiBrandsResponse.brands
    : Array.isArray(apiBrandsResponse)
    ? apiBrandsResponse
    : [];

  const options = [
    { value: "all", label: `All Brands (${rawBrands.length})` },
    ...rawBrands.map((b) => ({
      value: b._id,
      label: b.name,
      logo: b.logo,
    })),
  ];

  const selectedOption =
    options.find((opt) => opt.value === selectedBrand) ||
    (selectedBrand === "all" ? options[0] : null);

  return (
    <div className="w-52 sm:w-60">
      <Select
        classNamePrefix="react-select"
        isSearchable={true}
        isClearable={selectedBrand !== "all"}
        options={options}
        value={selectedOption}
        onChange={(opt) => onSelectBrand(opt ? opt.value : "all")}
        placeholder="Search brand..."
        isLoading={isLoading}
        formatOptionLabel={(option) => (
          <div className="flex items-center gap-2">
            {option.logo && (
              <img
                src={option.logo}
                alt={option.label}
                className="size-4 rounded-full object-contain bg-white shrink-0"
              />
            )}
            <span className="truncate text-sm">{option.label}</span>
          </div>
        )}
      />
    </div>
  );
};

export default BrandDropdown;
