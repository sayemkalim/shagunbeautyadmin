import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import CustomActionMenu from "@/components/custom_action";
import NavbarItem from "@/components/navbar/navbar_item";
import ShipmentZonesTable from "./components/ShipmentZonesTable";

const ShipmentZones = () => {
  const navigate = useNavigate();
  const [shipmentZoneLength, setShipmentZoneLength] = useState(0);
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
    navigate("/dashboard/shipment-zones/add");
  };

  const onRowsPerPageChange = (newRowsPerPage) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRowsPerPage,
    }));
  };

  const breadcrumbs = [{ title: "Shipment Zones", isNavigation: true }];

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col">
      <NavbarItem
        title="Shipment Zones"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-4">
        <CustomActionMenu
          title="Shipment Zone"
          total={shipmentZoneLength}
          onAdd={onAdd}
          searchText={searchText}
          handleSearch={handleSearch}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
        />
        <ShipmentZonesTable
          setShipmentZoneLength={setShipmentZoneLength}
          params={params}
          setParams={setParams}
        />
      </div>
    </div>
  );
};

export default ShipmentZones;
