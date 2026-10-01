import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Loader2, Layers } from "lucide-react";
import { useState } from "react";
import Typography from "@/components/typography";
import { fetchProductById } from "../helpers/fetchProductById";
import NavbarItem from "@/components/navbar/navbar_item";
import { migrateProductImages } from "../helpers/migrateProductImages";
import { toast } from "sonner";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [previewImg, setPreviewImg] = useState(null);
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product_details", id],
    queryFn: () => fetchProductById({ id }),
    select: (data) => data.response?.data,
    enabled: !!id,
  });



  if (isLoading || !product) {
    return (
      <div className="mx-auto max-w-4xl px-2 py-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const breadcrumbs = [
    { title: "Products", path: "/dashboard/products", isNavigation: true },
    { title: product?.name,  isNavigation: false },
  ];

  return (
    <div className="px-8 py-2 space-y-2">
      <NavbarItem title={"Products"} breadcrumbs={breadcrumbs} />

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-2 px-0 text-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" /> Back to Products
        </Button>
      </div>

      <div className="mx-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Product Images */}
        <div className="flex flex-col gap-4">
          <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
            <DialogTrigger asChild>
              <img
                src={product.banner_image}
                alt={product.name}
                className="bg-muted/30 shadow-elegant-sm h-[360px] w-full cursor-pointer rounded-xl border object-contain p-2"
                onClick={() => setPreviewImg(product.banner_image)}
              />
            </DialogTrigger>
            <DialogContent className="max-w-xl p-0">
              <img
                src={previewImg}
                alt="Preview"
                className="max-h-[80vh] w-full rounded-md object-contain"
              />
            </DialogContent>
          </Dialog>

          <div className="flex flex-col gap-2">
            <Typography variant="h5">Images</Typography>
            <div className="flex flex-wrap gap-2">
              {product.images?.map((img, idx) => (
                <Dialog key={idx}>
                  <DialogTrigger asChild>
                    <img
                      src={img}
                      alt={`Extra ${idx + 1}`}
                      className="border-input bg-muted/30 h-16 w-16 cursor-pointer rounded-md border object-contain p-1 transition-opacity hover:opacity-80"
                      onClick={() => setPreviewImg(img)}
                    />
                  </DialogTrigger>
                </Dialog>
              ))}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            {product.is_best_seller && (
              <Badge variant="secondary">Best Seller</Badge>
            )}
            {Array.isArray(product.price_tiers) && product.price_tiers.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Layers size={12} />
                {product.price_tiers.length} pack size{product.price_tiers.length > 1 ? "s" : ""}
              </Badge>
            )}
            {/* <Badge variant={product.instock ? "default" : "destructive"}>
  {product.instock ? "In Stock" : "Out of Stock"}
</Badge> */}
          </div>

          <p className="text-muted-foreground text-sm">
            {product.small_description}
          </p>

          <div className="flex items-center gap-3 text-xl">
            <span className="text-primary font-medium">
              ₹{product.discounted_price}
            </span>
            {product.price !== product.discounted_price && (
              <span className="text-muted-foreground text-base line-through">
                ₹{product.price}
              </span>
            )}
          </div>

          {Array.isArray(product.price_tiers) && product.price_tiers.length > 0 && (
            <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h4 className="text-foreground text-sm font-semibold">Bulk Pricing</h4>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="pb-1 font-medium">Buy Quantity</th>
                    <th className="pb-1 font-medium">Price Per Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-muted-foreground">
                    <td className="py-0.5">1 (standard)</td>
                    <td className="py-0.5">₹{product.discounted_price ?? product.price}</td>
                  </tr>
                  {product.price_tiers
                    .slice()
                    .sort((a, b) => a.quantity - b.quantity)
                    .map((tier) => (
                      <tr key={tier._id || tier.quantity} className="text-foreground">
                        <td className="py-0.5 font-medium">{tier.quantity}</td>
                        <td className="py-0.5 font-medium">₹{tier.price}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p className="text-muted-foreground text-xs">
                Customers can only order these exact quantities for this product.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {Array.isArray(product.tags) && product.tags.length > 0 && (
  <div className="flex flex-wrap gap-2">Tags :
    {product.tags.map((tag, index) => (
      <Badge key={index} variant="secondary">
        {tag
          .replace(/_/g, " ")       
          .replace(/\b\w/g, c => c.toUpperCase())
        }
      </Badge>
    ))}
  </div>
)}
            {(product.color || product.color_name) && (
              <Detail
                label="Color / Shade"
                value={
                  <div className="flex items-center gap-1.5">
                    {product.color && (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-border shrink-0 shadow-sm"
                        style={{ backgroundColor: product.color }}
                      />
                    )}
                    <span>
                      {[product.color_name, product.color].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                }
              />
            )}
            {product.brand && (
              <Detail label="Brand" value={product.brand.name} />
            )}
            {product.weight_in_grams && (
              <Detail
                label="Weight / Volume"
                value={
                  (() => {
                    const str = String(product.weight_in_grams).trim();
                    if (str.endsWith("g") || str.endsWith("ml")) {
                      return str;
                    }
                    const fallbackUnit = product.weight_unit ||
                      product.unit ||
                      (product.name && product.name.toLowerCase().includes("ml")
                        ? "ml"
                        : "g");
                    return `${str}${fallbackUnit}`;
                  })()
                }
              />
            )}
            {/* <Detail
              label="Expiry Date"
              value={
                product.expiry_date
                  ? dayjs(product.expiry_date).format("DD MMM, YYYY")
                  : "N/A"
              }
            /> */}
            <Detail
              label="Created At"
              value={dayjs(product.createdAt).format("DD MMM, YYYY")}
            />
            {/* <Detail label="Inventory" value={product.inventory || 0} />
            <Detail label="GST" value={product.gst} />
            <Detail label="CGST" value={product.cgst} />
            <Detail label="SGST" value={product.sgst} />
            <Detail label="IGST" value={product.igst} /> */}
          </div>

          {/* <div>
            <h3 className="font-medium text-gray-700 mb-1 text-sm">
              Full Description
            </h3>
            <p className="text-gray-600 text-sm">
              {product.full_description || "No description provided."}
            </p>
          </div> */}

          {product.meta_data?.points &&
            Array.isArray(product.meta_data.points) && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <h4 className="text-foreground mb-2 text-sm font-semibold">
                  Key Points
                </h4>
                <ul className="text-muted-foreground ml-4 list-disc space-y-1 text-xs">
                  {product.meta_data.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
{product.variants?.length > 0 && (
  <div className="space-y-2 mt-6">
    <Typography variant="h5">Variants</Typography>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {product.variants.map((variant) => (
        <div
          key={variant._id }
          className="bg-card shadow-elegant-sm rounded-lg border p-4"
        >
          <div className="flex justify-between items-center gap-3 mb-2">
            <h4 className="font-semibold text-base truncate whitespace-nowrap flex-1" title={variant.name}>
              {variant.name}
            </h4>
            <Badge
              variant={
                Number(variant.inventory) > 0 || variant.inventory === true
                  ? "default"
                  : "destructive"
              }
            >
              {Number(variant.inventory) > 0 || variant.inventory === true
                ? Number(variant.inventory) > 1
                  ? `In Stock (${variant.inventory})`
                  : "In Stock"
                : "Out of Stock"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-1">SKU: {variant.sku}</p>

          {(variant.color || variant.color_name || variant.weight_in_grams) && (
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2 flex-wrap">
              {(variant.color || variant.color_name) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-medium">Color:</span>
                  {variant.color && (
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-border shrink-0 shadow-sm"
                      style={{ backgroundColor: variant.color }}
                    />
                  )}
                  <span>
                    {[variant.color_name, variant.color].filter(Boolean).join(" - ")}
                  </span>
                </div>
              )}
              {(variant.color || variant.color_name) && variant.weight_in_grams ? " • " : ""}
              {variant.weight_in_grams && (
                <span>
                  Weight/Volume: {variant.weight_in_grams}
                  {variant.weight_unit ||
                    variant.unit ||
                    (variant.name && variant.name.toLowerCase().includes("ml")
                      ? "ml"
                      : product.name && product.name.toLowerCase().includes("ml")
                      ? "ml"
                      : "g")}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-base">
            <span className="text-primary font-semibold">
              ₹{variant.discounted_price}
            </span>
            {variant.price !== variant.discounted_price && (
              <span className="text-muted-foreground text-sm line-through">
                ₹{variant.price}
              </span>
            )}
          </div>

          {((Array.isArray(variant.images) && variant.images.length > 0) || variant.image) && (
            <div className="mt-3 flex gap-2">
              {(Array.isArray(variant.images) ? variant.images : [variant.image]).map((img, i) => (
                <Dialog key={i}>
                  <DialogTrigger asChild>
                    <img
                      src={img}
                      alt={`Variant ${variant.name} - Image ${i + 1}`}
                      className="border-input h-12 w-12 cursor-pointer rounded-md border object-cover transition-opacity hover:opacity-80"
                      onClick={() => setPreviewImg(img)}
                    />
                  </DialogTrigger>
                </Dialog>
              ))}
            </div>
          )}

          {Array.isArray(variant.price_tiers) && variant.price_tiers.length > 0 && (
            <div className="mt-3 bg-muted/40 rounded-md border p-2.5 space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers size={13} className="text-primary" /> Bulk Pricing
              </span>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground text-left border-b border-border/50">
                    <th className="pb-1 font-medium">Quantity Range</th>
                    <th className="pb-1 font-medium text-right">Price Per Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {variant.price_tiers.map((tier, idx) => (
                    <tr key={idx} className="text-foreground">
                      <td className="py-1">
                        {tier.min_qty}
                        {tier.max_qty ? ` - ${tier.max_qty}` : "+"} units
                      </td>
                      <td className="py-1 font-medium text-right">₹{tier.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

    </div>
    
  );
};

const Detail = ({ label, value }) => (
  <div>
    <span className="text-foreground font-medium">{label}:</span>
    <div className="text-muted-foreground">{value}</div>
  </div>
);

export default ProductDetails;
