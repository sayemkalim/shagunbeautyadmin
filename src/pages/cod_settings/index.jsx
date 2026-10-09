import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCodSettings } from "./helpers/fetchCodSettings";
import { updateCodSettings } from "./helpers/updateCodSettings";
import { BulkPincodeDialog } from "./components/BulkPincodeDialog";
import { CodTesterCard } from "./components/CodTesterCard";
import { toast } from "sonner";
import {
  Banknote,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Plus,
  Trash2,
  Copy,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Globe,
  IndianRupee,
  Layers,
  Sparkles,
  X,
  Sliders,
} from "lucide-react";

const CodSettings = () => {
  const queryClient = useQueryClient();

  // Local state for form values
  const [isCodEnabled, setIsCodEnabled] = useState(true);
  const [minOrderAmount, setMinOrderAmount] = useState(1);
  const [maxOrderAmount, setMaxOrderAmount] = useState(2000);
  const [codExtraCharge, setCodExtraCharge] = useState(0);
  const [allowAllPincodes, setAllowAllPincodes] = useState(false);
  const [allowedPincodes, setAllowedPincodes] = useState([]);

  // Pincode input & filter
  const [singlePincode, setSinglePincode] = useState("");
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Fetch COD Settings
  const { data: codRes, isLoading, isError, refetch } = useQuery({
    queryKey: ["cod-settings"],
    queryFn: fetchCodSettings,
  });

  // Sync loaded data into form state
  useEffect(() => {
    const data = codRes?.response?.data;
    if (data) {
      setIsCodEnabled(data.is_cod_enabled ?? true);
      setMinOrderAmount(data.min_order_amount ?? 1);
      setMaxOrderAmount(data.max_order_amount ?? 2000);
      setCodExtraCharge(data.cod_extra_charge ?? 0);
      setAllowAllPincodes(data.allow_all_pincodes ?? false);
      setAllowedPincodes(Array.isArray(data.allowed_pincodes) ? data.allowed_pincodes : []);
    }
  }, [codRes]);

  // Mutation to save settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: updateCodSettings,
    onSuccess: (res) => {
      if (res?.response?.success || res?.response?.statusCode === 200 || res?.response?.data) {
        toast.success("COD Settings updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["cod-settings"] });
      } else {
        toast.error(res?.response?.message || "Failed to update COD settings");
      }
    },
    onError: (err) => {
      console.error("Save COD settings error:", err);
      toast.error("An error occurred while saving COD settings.");
    },
  });

  const handleSave = () => {
    if (Number(minOrderAmount) < 0) {
      toast.error("Minimum order amount cannot be negative.");
      return;
    }
    if (Number(maxOrderAmount) <= Number(minOrderAmount)) {
      toast.error("Maximum order amount must be greater than minimum order amount.");
      return;
    }

    const payload = {
      is_cod_enabled: Boolean(isCodEnabled),
      min_order_amount: Number(minOrderAmount),
      max_order_amount: Number(maxOrderAmount),
      allowed_pincodes: allowedPincodes,
      allow_all_pincodes: Boolean(allowAllPincodes),
      cod_extra_charge: Number(codExtraCharge) || 0,
    };

    saveSettings({ data: payload });
  };

  // Add single pincode
  const handleAddSinglePincode = (e) => {
    e?.preventDefault();
    const pin = singlePincode.trim();
    if (!pin) return;

    if (!/^\d{6}$/.test(pin)) {
      toast.error("Pincode must be a 6-digit Indian postal code.");
      return;
    }

    if (allowedPincodes.includes(pin)) {
      toast.info(`Pincode ${pin} is already in the allowed list.`);
      setSinglePincode("");
      return;
    }

    setAllowedPincodes((prev) => [pin, ...prev]);
    setSinglePincode("");
    toast.success(`Pincode ${pin} added!`);
  };

  // Remove a pincode
  const handleRemovePincode = (pincodeToRemove) => {
    setAllowedPincodes((prev) => prev.filter((pin) => pin !== pincodeToRemove));
  };

  // Bulk add pincodes callback
  const handleBulkAdd = (newPins) => {
    setAllowedPincodes((prev) => [...new Set([...prev, ...newPins])]);
    toast.success(`Added ${newPins.length} pincodes!`);
  };

  // Clear all pincodes
  const handleClearAllPincodes = () => {
    if (allowedPincodes.length === 0) return;
    if (window.confirm("Are you sure you want to clear all allowed pincodes?")) {
      setAllowedPincodes([]);
      toast.info("Allowed pincodes cleared.");
    }
  };

  // Copy all pincodes
  const handleCopyAll = () => {
    if (allowedPincodes.length === 0) {
      toast.info("No pincodes to copy.");
      return;
    }
    navigator.clipboard.writeText(allowedPincodes.join(", "));
    toast.success(`Copied ${allowedPincodes.length} pincodes to clipboard!`);
  };

  // Filtered pincodes for search
  const filteredPincodes = useMemo(() => {
    if (!pincodeSearch.trim()) return allowedPincodes;
    return allowedPincodes.filter((pin) =>
      String(pin).includes(pincodeSearch.trim())
    );
  }, [allowedPincodes, pincodeSearch]);

  const breadcrumbs = [{ title: "COD Settings", isNavigation: true }];

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-muted/20">
      <NavbarItem title="Cash on Delivery (COD) Settings" breadcrumbs={breadcrumbs} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header & Save Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border p-5 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">COD Configuration</h2>
              {isCodEnabled ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  COD Active
                </Badge>
              ) : (
                <Badge variant="destructive" className="font-medium">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  COD Disabled Globally
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Manage order thresholds, PAN-India coverage, and pincode whitelisting for Cash on Delivery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isSaving}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="gap-1.5 bg-primary font-medium"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : isError ? (
          <Card className="border-destructive/30 bg-destructive/5 text-center py-10">
            <CardContent className="space-y-4">
              <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Failed to load COD Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Could not retrieve current settings from the server.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Master Switch Card */}
            <Card className="border shadow-xs overflow-hidden">
              <div className={`h-1.5 w-full ${isCodEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${isCodEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      <Banknote className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">Enable Cash on Delivery</span>
                        <Badge variant={isCodEnabled ? "default" : "secondary"}>
                          {isCodEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xl">
                        When turned off, COD option will be completely hidden on mobile and web checkouts regardless of cart value or customer pincode.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {isCodEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={isCodEnabled}
                      onCheckedChange={setIsCodEnabled}
                      aria-label="Toggle Cash on Delivery"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Thresholds & Fees Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Min Order Value */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Min Order Amount
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Minimum cart subtotal to allow COD checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      className="pl-8 font-semibold text-base"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 100, 299, 499].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs bg-muted/60 hover:bg-muted"
                        onClick={() => setMinOrderAmount(val)}
                      >
                        ₹{val}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Max Order Value */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Max Order Amount
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Risk Control</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Orders above this threshold require online payment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={maxOrderAmount}
                      onChange={(e) => setMaxOrderAmount(e.target.value)}
                      className="pl-8 font-semibold text-base"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1000, 2000, 3000, 5000].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs bg-muted/60 hover:bg-muted"
                        onClick={() => setMaxOrderAmount(val)}
                      >
                        ₹{val}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* COD Extra Handling Charge */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-primary" />
                      COD Handling Charge
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Additional handling fee added to COD orders (₹0 for free).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={codExtraCharge}
                      onChange={(e) => setCodExtraCharge(e.target.value)}
                      className="pl-8 font-semibold text-base"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[0, 29, 49, 99].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs bg-muted/60 hover:bg-muted"
                        onClick={() => setCodExtraCharge(val)}
                      >
                        {val === 0 ? "Free (₹0)" : `₹${val}`}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pincode Whitelist & PAN India Management */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base font-semibold">Pincode Serviceability & Whitelisting</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Control which postal codes are eligible for Cash on Delivery.
                    </CardDescription>
                  </div>

                  {/* PAN-India Toggle Switch */}
                  <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border">
                    <div className="space-y-0.5 text-right sm:text-left">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        Allow All Pincodes (PAN-India)
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {allowAllPincodes ? "Bypassing pincode whitelist" : "Restricted to whitelist below"}
                      </p>
                    </div>
                    <Switch
                      checked={allowAllPincodes}
                      onCheckedChange={setAllowAllPincodes}
                      aria-label="Allow All Pincodes"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-6">
                {/* Banner if PAN-India is enabled */}
                {allowAllPincodes ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">PAN-India COD Mode is Active</h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                        Customers from any Indian pincode can place COD orders (provided order amount meets ₹{minOrderAmount} - ₹{maxOrderAmount} range). The pincode whitelist below is currently in reserve and will reactivate if PAN-India is toggled off.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Single Pincode Input + Bulk Add Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <form onSubmit={handleAddSinglePincode} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter 6-digit Pincode (e.g. 206001)"
                        maxLength={6}
                        value={singlePincode}
                        onChange={(e) => setSinglePincode(e.target.value.replace(/\D/g, ""))}
                        className="pl-9 font-mono"
                      />
                    </div>
                    <Button type="submit" disabled={!singlePincode.trim()} className="gap-1.5 shrink-0">
                      <Plus className="h-4 w-4" />
                      Add Pincode
                    </Button>
                  </form>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBulkDialogOpen(true)}
                      className="gap-1.5"
                    >
                      <Layers className="h-4 w-4 text-primary" />
                      Bulk Import
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyAll}
                      title="Copy all pincodes"
                      className="h-9 w-9 border"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleClearAllPincodes}
                      title="Clear all pincodes"
                      className="h-9 w-9 border text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Search / Filter in Pincodes List */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Allowed Pincodes List
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {allowedPincodes.length} Total
                    </Badge>
                  </div>

                  {allowedPincodes.length > 5 && (
                    <div className="relative w-full sm:w-64">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Filter list..."
                        value={pincodeSearch}
                        onChange={(e) => setPincodeSearch(e.target.value)}
                        className="h-8 pl-8 text-xs font-mono"
                      />
                      {pincodeSearch && (
                        <button
                          type="button"
                          onClick={() => setPincodeSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Pincode Badges Container */}
                <div className="rounded-xl border bg-muted/20 p-4 min-h-32 max-h-72 overflow-y-auto">
                  {allowedPincodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2">
                      <MapPin className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                      <p className="text-sm font-medium">No pincodes added yet.</p>
                      <p className="text-xs max-w-sm">
                        {allowAllPincodes
                          ? "PAN-India is active, so all areas qualify. You can also add specific pincodes as a backup."
                          : "Without pincodes, COD will not be available unless 'Allow All Pincodes' is turned on."}
                      </p>
                    </div>
                  ) : filteredPincodes.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No pincodes matched &quot;{pincodeSearch}&quot;
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredPincodes.map((pin) => (
                        <span
                          key={pin}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background border shadow-2xs text-xs font-mono font-medium hover:border-primary/50 transition-colors"
                        >
                          <span className="text-foreground">{pin}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePincode(pin)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors"
                            aria-label={`Remove pincode ${pin}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Testing Tool Widget */}
            <CodTesterCard />
          </>
        )}
      </div>

      {/* Bulk Pincode Modal */}
      <BulkPincodeDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        existingPincodes={allowedPincodes}
        onAddPincodes={handleBulkAdd}
      />
    </div>
  );
};

export default CodSettings;
