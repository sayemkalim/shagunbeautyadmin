import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Typography from "@/components/typography";
import {
  Sparkles,
  Pencil,
  Package,
  ExternalLink,
  Plus,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import dayjs from "dayjs";

const ActiveBannerCard = ({
  activeBanner,
  isLoading,
  onEdit,
  onAdd,
  productsMap = new Map(),
}) => {
  if (isLoading) {
    return (
      <Card className="mb-6 overflow-hidden border-border/80 shadow-xs">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <Skeleton className="md:col-span-6 h-48 w-full rounded-xl" />
            <div className="md:col-span-6 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!activeBanner) {
    return (
      <Card className="mb-6 border-dashed border-2 border-border/80 bg-muted/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="size-6" />
            </div>
            <div>
              <Typography variant="h4" className="font-semibold text-base">
                No Top Single Banner Uploaded
              </Typography>
              <Typography variant="small" className="text-muted-foreground">
                Upload a top single banner (PNG or JPG) to display on your storefront. Only one banner can be added at a time.
              </Typography>
            </div>
          </div>
          <Button onClick={onAdd} className="gap-2 shrink-0 cursor-pointer">
            <Plus className="size-4" />
            <span>Upload Banner</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const imageUrl =
    activeBanner.banner_image ||
    activeBanner.banner_url ||
    activeBanner.image ||
    activeBanner.imageUrl;

  // Resolve linked product
  let productObj = null;
  if (activeBanner.product) {
    if (typeof activeBanner.product === "object") {
      productObj = activeBanner.product;
    } else if (productsMap.has(activeBanner.product)) {
      productObj = productsMap.get(activeBanner.product);
    }
  }

  return (
    <Card className="mb-6 overflow-hidden border border-border shadow-xs bg-linear-to-b from-card to-card/60">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h4" className="font-semibold text-base">
                Current Top Single Banner
              </Typography>
              {activeBanner.is_active && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <Typography variant="small" className="text-muted-foreground text-xs">
              {activeBanner.is_active
                ? "This banner is actively live on the storefront."
                : "This banner is currently inactive (hidden from storefront)."}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              activeBanner.is_active
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium px-2.5 py-0.5"
                : "bg-destructive/10 text-destructive border-destructive/20 font-medium px-2.5 py-0.5"
            }
          >
            {activeBanner.is_active ? "Live On Store" : "Inactive"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(activeBanner)}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <Pencil className="size-3.5" />
            <span>Edit Banner</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Banner Image Preview */}
          <div className="lg:col-span-7">
            <div className="relative group rounded-xl overflow-hidden border border-border/80 bg-muted aspect-[21/9] sm:aspect-[16/6] shadow-inner">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Top Single Banner"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image available
                </div>
              )}
            </div>
          </div>

          {/* Banner Details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Linked Destination: Product or Custom Link */}
            <div className="space-y-1.5">
              <Typography variant="small" className="text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                Linked Destination
              </Typography>

              {productObj ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/40">
                  {productObj.banner_image ? (
                    <img
                      src={productObj.banner_image}
                      alt={productObj.name}
                      className="size-10 rounded-md object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="size-10 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0 border border-border">
                      <Package className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {productObj.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {productObj.sku && (
                        <span className="text-[11px] text-muted-foreground">
                          SKU: {productObj.sku}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeBanner.link ? (
                <a
                  href={activeBanner.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border/70 bg-muted/40 text-xs text-primary hover:underline group"
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span className="truncate flex-1 font-medium">{activeBanner.link}</span>
                  <ArrowUpRight className="size-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                </a>
              ) : (
                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground italic">
                  Direct link / No product linked
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
              <span>
                Uploaded: {activeBanner.createdAt ? dayjs(activeBanner.createdAt).format("DD MMM YYYY, hh:mm A") : "—"}
              </span>
              <span>Status: {activeBanner.is_active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveBannerCard;
