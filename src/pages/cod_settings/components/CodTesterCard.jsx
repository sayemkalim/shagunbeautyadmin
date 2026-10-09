import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkCodEligibility } from "../helpers/checkCodEligibility";
import { CheckCircle2, XCircle, Search, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const CodTesterCard = () => {
  const [testPincode, setTestPincode] = useState("206001");
  const [testAmount, setTestAmount] = useState("1500");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async (e) => {
    e?.preventDefault();
    if (!testPincode.trim()) {
      toast.error("Please enter a pincode to test");
      return;
    }
    if (!testAmount || Number(testAmount) <= 0) {
      toast.error("Please enter a valid order amount to test");
      return;
    }

    try {
      setLoading(true);
      const res = await checkCodEligibility({
        pincode: testPincode.trim(),
        amount: Number(testAmount),
      });

      if (res?.response?.data) {
        setResult(res.response.data);
      } else if (res?.response) {
        setResult(res.response);
      } else {
        toast.error("Failed to check eligibility. Please ensure backend is running.");
      }
    } catch (err) {
      console.error("Test eligibility error:", err);
      toast.error("Error running COD eligibility test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-muted-foreground/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Live COD Eligibility Simulator</CardTitle>
            <CardDescription className="text-xs">
              Test customer checkout conditions against the active backend COD rules in real time.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleTest} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Delivery Pincode</label>
            <Input
              placeholder="e.g. 206001"
              maxLength={6}
              value={testPincode}
              onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, ""))}
              className="font-mono text-sm"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cart Amount (₹)</label>
            <Input
              type="number"
              placeholder="e.g. 1500"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="text-sm font-medium"
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Test
            </Button>
          </div>
        </form>

        {result && (
          <div
            className={`rounded-xl border p-4 transition-all duration-200 ${
              result.eligible
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.eligible ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={result.eligible ? "default" : "destructive"}
                    className={
                      result.eligible
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white font-medium"
                        : "bg-rose-600 hover:bg-rose-600 text-white font-medium"
                    }
                  >
                    {result.eligible ? "Eligible for COD" : "Disqualified for COD"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    Pincode: {testPincode} | Amount: ₹{testAmount}
                  </span>
                </div>
                <p className="text-sm font-medium pt-1">
                  {result.reason || (result.eligible ? "COD is available for this order." : "Order does not qualify for COD.")}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
