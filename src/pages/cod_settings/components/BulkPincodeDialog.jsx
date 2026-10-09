import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Plus, CopyCheck } from "lucide-react";

export const BulkPincodeDialog = ({
  open,
  onOpenChange,
  existingPincodes = [],
  onAddPincodes,
}) => {
  const [pincodeText, setPincodeText] = useState("");

  // Parse raw text into tokens
  const parsedResults = useMemo(() => {
    if (!pincodeText.trim()) {
      return { valid: [], duplicates: [], invalid: [] };
    }

    // Split by comma, whitespace, newline, semicolon, or slash
    const rawTokens = pincodeText
      .split(/[\s,;\n\t\r]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const existingSet = new Set(existingPincodes.map(String));
    const valid = [];
    const duplicates = [];
    const invalid = [];
    const seenInInput = new Set();

    for (const token of rawTokens) {
      // Check 6-digit numeric pattern
      if (/^\d{6}$/.test(token)) {
        if (existingSet.has(token) || seenInInput.has(token)) {
          if (!seenInInput.has(token)) {
            duplicates.push(token);
          }
        } else {
          valid.push(token);
          seenInInput.add(token);
        }
      } else {
        invalid.push(token);
      }
    }

    return { valid, duplicates, invalid };
  }, [pincodeText, existingPincodes]);

  const handleAdd = () => {
    if (parsedResults.valid.length > 0) {
      onAddPincodes(parsedResults.valid);
      setPincodeText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Bulk Add Pincodes
          </DialogTitle>
          <DialogDescription>
            Paste or type multiple 6-digit Indian postal codes separated by commas, spaces, or newlines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Textarea
              placeholder="e.g. 110001, 110002, 206001&#10;560001 400001"
              value={pincodeText}
              onChange={(e) => setPincodeText(e.target.value)}
              rows={6}
              className="font-mono text-sm resize-y"
            />
          </div>

          {pincodeText.trim() && (
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {parsedResults.valid.length} New Valid
                </span>
                {parsedResults.duplicates.length > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <CopyCheck className="h-4 w-4" />
                    {parsedResults.duplicates.length} Already Added / Duplicate
                  </span>
                )}
                {parsedResults.invalid.length > 0 && (
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {parsedResults.invalid.length} Invalid Format
                  </span>
                )}
              </div>

              {parsedResults.valid.length > 0 && (
                <div className="pt-2 border-t flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {parsedResults.valid.map((pin) => (
                    <Badge key={pin} variant="secondary" className="font-mono">
                      {pin}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPincodeText("");
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={parsedResults.valid.length === 0}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add {parsedResults.valid.length > 0 ? `${parsedResults.valid.length} Pincodes` : "Pincodes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
