import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDeliverySettings } from "./helpers/fetchDeliverySettings";
import { updateDeliverySettings } from "./helpers/updateDeliverySettings";
import { toast } from "sonner";
import {
  Truck,
  IndianRupee,
  Gift,
  ShieldCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Loader2,
  Sliders,
} from "lucide-react";

const DeliverySettings = () => {
  const queryClient = useQueryClient();

  const [isDeliveryFeeEnabled, setIsDeliveryFeeEnabled] = useState(true);
  const [minOrderAmount, setMinOrderAmount] = useState(1);
  const [maxOrderAmount, setMaxOrderAmount] = useState(2000);
  const [deliveryFee, setDeliveryFee] = useState(50);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(2000);
  const [description, setDescription] = useState("Standard Delivery Fee Rules");

  // Interactive tester cart amount
  const [simCartAmount, setSimCartAmount] = useState("1200");

  // Fetch Delivery Settings
  const { data: settingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ["delivery-fee-settings"],
    queryFn: fetchDeliverySettings,
  });

  // Populate data into local state
  useEffect(() => {
    const data = settingsRes?.response?.data || settingsRes?.data;
    if (data) {
      setIsDeliveryFeeEnabled(data.is_delivery_fee_enabled ?? true);
      setMinOrderAmount(data.min_order_amount ?? 1);
      setMaxOrderAmount(data.max_order_amount ?? 2000);
      setDeliveryFee(data.delivery_fee ?? 50);
      setFreeDeliveryAbove(data.free_delivery_above ?? 2000);
      setDescription(data.description || "Standard Delivery Fee Rules");
    }
  }, [settingsRes]);

  // Mutation to save
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: updateDeliverySettings,
    onSuccess: (res) => {
      const isSuccess =
        res?.response?.success ||
        res?.success ||
        res?.response?.statusCode === 200 ||
        res?.response?.data;

      if (isSuccess) {
        toast.success("Delivery Fee Settings updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["delivery-fee-settings"] });
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to update delivery settings.");
      }
    },
    onError: (err) => {
      console.error("Save delivery fee settings error:", err);
      toast.error("An error occurred while saving delivery settings.");
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
    if (Number(deliveryFee) < 0) {
      toast.error("Delivery charge cannot be negative.");
      return;
    }
    if (Number(freeDeliveryAbove) < 0) {
      toast.error("Free delivery threshold cannot be negative.");
      return;
    }

    const payload = {
      is_delivery_fee_enabled: Boolean(isDeliveryFeeEnabled),
      min_order_amount: Number(minOrderAmount),
      max_order_amount: Number(maxOrderAmount),
      delivery_fee: Number(deliveryFee),
      free_delivery_above: Number(freeDeliveryAbove),
      description: description.trim(),
    };

    saveSettings({ data: payload });
  };

  // Calculate simulated shipping cost
  const testAmountNum = Number(simCartAmount) || 0;
  const simResult = (() => {
    if (!isDeliveryFeeEnabled) {
      return { fee: 0, reason: "Delivery fee disabled globally. 100% Free Shipping applies." };
    }
    if (testAmountNum >= Number(freeDeliveryAbove)) {
      return {
        fee: 0,
        reason: `Cart amount (₹${testAmountNum}) meets or exceeds the Free Delivery threshold (₹${freeDeliveryAbove}).`,
      };
    }
    if (testAmountNum >= Number(minOrderAmount) && testAmountNum <= Number(maxOrderAmount)) {
      return {
        fee: Number(deliveryFee),
        reason: `Cart amount (₹${testAmountNum}) falls within standard delivery bracket (₹${minOrderAmount} - ₹${maxOrderAmount}).`,
      };
    }
    return {
      fee: Number(deliveryFee),
      reason: `Standard delivery charge of ₹${deliveryFee} applied.`,
    };
  })();

  const breadcrumbs = [{ title: "Delivery Settings", isNavigation: true }];

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-muted/20">
      <NavbarItem title="Delivery Fee Settings" breadcrumbs={breadcrumbs} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header & Save Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border p-5 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Delivery Fee Configuration</h2>
              {isDeliveryFeeEnabled ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fees Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-medium">
                  <Gift className="h-3 w-3 mr-1" />
                  Free Shipping For All
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Configure universal order delivery fee brackets and free delivery thresholds across checkout.
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
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        ) : isError ? (
          <Card className="border-destructive/30 bg-destructive/5 text-center py-10">
            <CardContent className="space-y-4">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Failed to load Delivery Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Could not retrieve current settings from the backend.
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
            {/* Master Toggle Card */}
            <Card className="border shadow-xs overflow-hidden">
              <div
                className={`h-1.5 w-full ${
                  isDeliveryFeeEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
              />
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        isDeliveryFeeEnabled
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">Enable Delivery Charges</span>
                        <Badge variant={isDeliveryFeeEnabled ? "default" : "secondary"}>
                          {isDeliveryFeeEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xl">
                        When toggled on, delivery fees are calculated based on cart amount. When toggled off, all orders across the store receive 100% Free Shipping.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {isDeliveryFeeEnabled ? "Active" : "Disabled"}
                    </span>
                    <Switch
                      checked={isDeliveryFeeEnabled}
                      onCheckedChange={setIsDeliveryFeeEnabled}
                      aria-label="Toggle Delivery Fee"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thresholds & Fee Brackets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delivery Fee */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Standard Delivery Charge
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-mono">Charge</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Fee applied when order value is within the standard bracket.
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
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="pl-8 font-semibold text-base"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[0, 40, 50, 60, 99].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs bg-muted/60 hover:bg-muted"
                        onClick={() => setDeliveryFee(val)}
                      >
                        {val === 0 ? "Free (₹0)" : `₹${val}`}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Free Delivery Above Threshold */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Gift className="h-4 w-4 text-primary" />
                      Free Delivery Above
                    </CardTitle>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                      Free Shipping
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Orders with cart amount equal to or exceeding this qualify for ₹0 delivery.
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
                      value={freeDeliveryAbove}
                      onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                      className="pl-8 font-semibold text-base"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[999, 1499, 1999, 2000, 2500].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs bg-muted/60 hover:bg-muted"
                        onClick={() => setFreeDeliveryAbove(val)}
                      >
                        ₹{val}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Min Order Amount */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-primary" />
                      Minimum Order Amount
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Min Limit</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Lower order amount boundary for standard fee application.
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
                    {[1, 99, 199, 299, 499].map((val) => (
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

              {/* Max Order Amount */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-primary" />
                      Maximum Order Amount
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Upper Bound</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Upper boundary for standard delivery bracket.
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
            </div>

            {/* Description Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Internal Policy Description</CardTitle>
                <CardDescription className="text-xs">
                  Notes or display name for this delivery fee rule.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Standard Delivery Fee Rules"
                  rows={2}
                />
              </CardContent>
            </Card>

            {/* Live Interactive Simulator Card */}
            <Card className="border shadow-xs bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Live Delivery Fee Simulator</CardTitle>
                    <CardDescription className="text-xs">
                      See the exact delivery charge that will be calculated for a given customer cart value.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Test Cart Total (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        ₹
                      </span>
                      <Input
                        type="number"
                        placeholder="e.g. 1200"
                        value={simCartAmount}
                        onChange={(e) => setSimCartAmount(e.target.value)}
                        className="pl-8 font-semibold text-sm"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-center">
                    <div className="w-full rounded-xl border p-3.5 bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Calculated Delivery Charge:</span>
                        <span className="text-base font-bold text-foreground">
                          {simResult.fee === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">FREE (₹0)</span>
                          ) : (
                            `₹${simResult.fee}`
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{simResult.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>
                    Summary: Orders &lt; ₹{freeDeliveryAbove} incur ₹{deliveryFee} delivery charge. Orders ≥ ₹{freeDeliveryAbove} qualify for Free Delivery.
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DeliverySettings;
