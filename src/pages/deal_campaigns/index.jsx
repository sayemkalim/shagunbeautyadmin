import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import {
  Flame,
  Zap,
  Globe,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Plus,
  TrendingUp,
} from "lucide-react";
import NavbarItem from "@/components/navbar/navbar_item";
import CustomActionMenu from "@/components/custom_action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import DealCampaignsTable from "./components/DealCampaignsTable";
import DealCampaignModal from "./components/DealCampaignModal";
import { fetchDealCampaigns } from "./helpers/fetchDealCampaigns";
import { getRemainingTime } from "./components/CountdownBadge";

const DealCampaigns = () => {
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 400);

  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");

  const [params, setParams] = useState({
    page: 1,
    per_page: 25,
    search: "",
    is_active: undefined,
    apply_to: undefined,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState(null);

  // Sync debounced search to query params
  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      search: debouncedSearch,
      page: 1,
    }));
  }, [debouncedSearch]);

  // Fetch campaigns
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deal-campaigns", params],
    queryFn: () => fetchDealCampaigns({ params }),
  });

  const campaignData = apiResponse?.response?.data || apiResponse?.data || {};
  const rawCampaigns = campaignData?.campaigns || (Array.isArray(campaignData) ? campaignData : []);
  const total = campaignData?.total || rawCampaigns.length || 0;
  const totalPages = campaignData?.total_pages || Math.ceil(total / (params.per_page || 25)) || 1;

  // Stats calculation
  const stats = useMemo(() => {
    let activeCount = 0;
    let storewideCount = 0;
    let expiredCount = 0;

    rawCampaigns.forEach((c) => {
      const remaining = getRemainingTime(c.sale_end_time);
      if (remaining.isExpired) {
        expiredCount += 1;
      } else if (c.is_active) {
        activeCount += 1;
      }

      if (c.apply_to === "ALL_PRODUCTS") {
        storewideCount += 1;
      }
    });

    return {
      total,
      active: activeCount,
      storewide: storewideCount,
      expired: expiredCount,
    };
  }, [rawCampaigns, total]);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setParams((prev) => ({
      ...prev,
      is_active: value === "all" ? undefined : value === "true",
      page: 1,
    }));
  };

  const handleScopeFilterChange = (value) => {
    setScopeFilter(value);
    setParams((prev) => ({
      ...prev,
      apply_to: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const onRowsPerPageChange = (newRows) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRows,
      page: 1,
    }));
  };

  const handleOpenAdd = () => {
    setCampaignToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (campaign) => {
    setCampaignToEdit(campaign);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCampaignToEdit(null);
  };

  const breadcrumbs = [
    { title: "Dashboard", isNavigation: true, url: "/dashboard" },
    { title: "Deal / Flash Sale Campaigns", isNavigation: false },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarItem title="Deal & Flash Sale Campaigns" breadcrumbs={breadcrumbs} />

      <div className="px-4 py-3 space-y-4">
        {/* KPI / Overview Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Campaigns */}
          <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Campaigns
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{total}</p>
                <p className="text-[11px] text-muted-foreground">Managed deal events</p>
              </div>
              <div className="size-11 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Flame className="size-6 fill-current" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Live Active Deals */}
          <Card className="border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs bg-emerald-50/30 dark:bg-emerald-950/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Live Active Deals
                  </p>
                </div>
                <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                  {stats.active}
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Countdown ticking on PDP
                </p>
              </div>
              <div className="size-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Zap className="size-6 fill-current" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Storewide Catalog Deals */}
          <Card className="border border-border/80 shadow-xs bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Storewide Deals
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {stats.storewide}
                </p>
                <p className="text-[11px] text-muted-foreground">Applies to all products</p>
              </div>
              <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Globe className="size-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Expired Campaigns */}
          <Card className="border border-border/80 shadow-xs bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expired Campaigns
                </p>
                <p className="text-2xl font-bold tracking-tight text-muted-foreground">
                  {stats.expired}
                </p>
                <p className="text-[11px] text-muted-foreground">Completed deal sales</p>
              </div>
              <div className="size-11 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center">
                <Clock className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Menu with Search, Filters & Create Button */}
        <CustomActionMenu
          title="Deal Campaigns"
          total={total}
          onAdd={handleOpenAdd}
          searchText={searchText}
          handleSearch={handleSearch}
          searchPlaceholder="Search campaigns by title..."
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          extraFilters={
            <div className="flex flex-wrap items-center gap-2">
              {/* Target Scope Filter Dropdown */}
              <Select value={scopeFilter} onValueChange={handleScopeFilterChange}>
                <SelectTrigger className="w-[170px] bg-background text-xs font-medium">
                  <SelectValue placeholder="Target Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Target Scopes</SelectItem>
                  <SelectItem value="SPECIFIC_PRODUCTS">Specific Products</SelectItem>
                  <SelectItem value="BY_BRAND">By Brand</SelectItem>
                  <SelectItem value="BY_CATEGORY">By Category</SelectItem>
                  <SelectItem value="ALL_PRODUCTS">All Products (Storewide)</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter Dropdown */}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[140px] bg-background text-xs font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Paused Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Campaigns Table */}
        <DealCampaignsTable
          campaigns={rawCampaigns}
          isLoading={isLoading}
          error={error}
          params={params}
          setParams={setParams}
          total={total}
          totalPages={totalPages}
          onEditCampaign={handleOpenEdit}
        />
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <DealCampaignModal
          open={isModalOpen}
          onClose={handleCloseModal}
          campaignToEdit={campaignToEdit}
        />
      )}
    </div>
  );
};

export default DealCampaigns;
