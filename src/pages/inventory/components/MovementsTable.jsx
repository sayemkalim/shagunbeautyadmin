import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchInventoryMovements } from "../helpers/fetchInventoryMovements";
import { getApiData, isApiError } from "../helpers/apiResult";
import { getMovementTypeLabel, getMovementTypeBadgeClass, isSystemMovementType } from "../helpers/movementBadge";

const truncateId = (id) => (typeof id === "string" && id.length > 10 ? `${id.slice(0, 8)}…` : id);

const MovementsTable = ({ sku, product, perPage = 20, showSkuColumn }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const displaySkuColumn = showSkuColumn ?? !sku;

  useEffect(() => {
    setPage(1);
  }, [sku, product]);

  const params = { sku, product, page, per_page: perPage };

  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ["inventory-movements", params],
    queryFn: () => fetchInventoryMovements({ params }),
  });

  const movements = useMemo(() => {
    if (isApiError(apiResponse)) return [];
    return getApiData(apiResponse)?.data || [];
  }, [apiResponse]);

  const total = !isApiError(apiResponse) ? getApiData(apiResponse)?.total || 0 : 0;
  const totalPages = Math.ceil(total / perPage);

  const columns = [
    ...(displaySkuColumn
      ? [
          {
            key: "sku",
            label: "SKU",
            render: (skuValue) => (
              <Typography variant="p" className="font-mono text-xs">
                {skuValue}
              </Typography>
            ),
          },
        ]
      : []),
    {
      key: "type",
      label: "Type",
      render: (type) => (
        <Badge className={cn("w-fit capitalize", getMovementTypeBadgeClass(type))}>
          {getMovementTypeLabel(type)}
        </Badge>
      ),
    },
    {
      key: "quantity_change",
      label: "Change",
      render: (change) => (
        <Typography
          variant="p"
          className={cn("font-medium tabular-nums", change > 0 ? "text-[var(--color-success)]" : change < 0 ? "text-destructive" : "text-muted-foreground")}
        >
          {change > 0 ? `+${change}` : change}
        </Typography>
      ),
    },
    {
      key: "quantity_before",
      label: "Before → After",
      render: (before, row) => (
        <Typography variant="p" className="text-muted-foreground tabular-nums">
          {before} <span className="text-foreground">→ {row.quantity_after}</span>
        </Typography>
      ),
    },
    {
      key: "reference_type",
      label: "Reference",
      render: (referenceType, row) =>
        referenceType === "order" && row.reference_id ? (
          <Button
            variant="link"
            className="h-auto p-0 font-mono text-xs"
            onClick={() => navigate(`/dashboard/orders/${row.reference_id}`)}
          >
            #{truncateId(row.reference_id)}
          </Button>
        ) : (
          <Typography variant="small" className="text-muted-foreground">
            Manual
          </Typography>
        ),
    },
    {
      key: "note",
      label: "Note",
      render: (note) => (
        <Typography variant="p" className="text-muted-foreground max-w-[180px] truncate">
          {note || "—"}
        </Typography>
      ),
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (date) => (
        <div className="flex flex-col gap-0.5">
          <Typography variant="p">{format(new Date(date), "dd/MM/yyyy")}</Typography>
          <Typography variant="small" className="text-muted-foreground">
            {format(new Date(date), "hh:mm a")}
          </Typography>
        </div>
      ),
    },
    {
      key: "created_by_admin",
      label: "By",
      render: (adminId, row) =>
        adminId ? (
          <Typography variant="p" className="font-mono text-xs">
            {truncateId(adminId)}
          </Typography>
        ) : (
          <Badge variant="secondary" className="w-fit">
            {isSystemMovementType(row.type) ? "System (Order)" : "System"}
          </Badge>
        ),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={movements}
      isLoading={isLoading}
      error={error}
      perPage={perPage}
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      emptyStateMessage="No stock movements recorded yet."
    />
  );
};

export default MovementsTable;
