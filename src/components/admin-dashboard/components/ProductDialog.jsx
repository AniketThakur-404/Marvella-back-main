import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { API_BASE, slugify } from "../utils";

const FORMAT_ACTIONS = [
  { key: "bold", label: "B", className: "font-bold" },
  { key: "italic", label: "I", className: "italic" },
  { key: "underline", label: "U", className: "underline" },
];

const SECTIONS = [
  { value: "details", label: "Details", description: "Core product information" },
  { value: "inventory", label: "Inventory", description: "Stock levels and availability" },
  { value: "media", label: "Media", description: "Images and visual assets" },
  { value: "shipping", label: "Shipping", description: "Packaging and fulfilment" },
  { value: "pricing", label: "Pricing", description: "Retail and compare-at pricing" },
];

const defaultRequest = (url, options) => fetch(url, options);

const generateId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

function ProductFormBase({
  layout = "dialog",
  mode = "create",
  product = null,
  productId,
  open = false,
  onClose = () => {},
  collections = [],
  request = defaultRequest,
  refresh = () => {},
  afterSubmit,
  formId,
}) {
  const isDialog = layout === "dialog";
  const isEdit = mode === "edit";
  const resolvedFormId = formId ?? (isDialog ? "product-dialog-form" : "product-create-form");

  const defaultValues = {
    name: "",
    slug: "",
    description: "",
    finish: "",
    basePrice: "",
    collectionId: "",
    compareAtPrice: "",
    shippingWeight: "",
    shippingLength: "",
    shippingWidth: "",
    shippingHeight: "",
    inventoryQuantity: "",
    inventorySku: "",
    onlineSelling: true,
    inStoreSelling: false,
  };

  const { register, handleSubmit, setValue, reset, getValues, watch } = useForm({
    defaultValues: { ...defaultValues },
  });

  const generateShadeKey = () => generateId();

  const createEmptyShade = () => ({
    key: generateShadeKey(),
    name: "",
    hexColor: "#a21caf",
    sku: "",
    price: "",
    quantity: "",
  });

  const [manualSlug, setManualSlug] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [shadesState, setShadesState] = useState(() => [createEmptyShade()]);
  const [submitting, setSubmitting] = useState(false);
  const [descriptionFileName, setDescriptionFileName] = useState("");
  const [activeTab, setActiveTab] = useState(SECTIONS[0].value);

  // NOTE: no TS generics here; this is .jsx
  const editorRef = useRef(null);
  const textFileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Keep description in a ref to avoid re-renders while typing
  const descriptionRef = useRef("");

  const collectionOptions = Array.isArray(collections) ? collections : [];

  useEffect(() => {
    if (!isDialog) return;
    if (!open) {
      reset();
      setManualSlug(false);
      setImages([]);
      setSubmitting(false);
      setDescriptionFileName("");
      if (editorRef.current) editorRef.current.innerHTML = "";
      descriptionRef.current = "";
      setActiveTab(SECTIONS[0].value);
      setExistingImages([]);
      setShadesState([createEmptyShade()]);
    }
  }, [isDialog, open, reset]);

  // keep the field registered, but don't mirror on each keystroke
  useEffect(() => {
    register("description");
  }, [register]);

  // Map product to form values (used on edit)
  const mapProductToForm = (prod) => ({
    ...defaultValues,
    name: prod?.name ?? "",
    slug: prod?.slug ?? "",
    description: prod?.description ?? "",
    finish: prod?.finish ?? "",
    basePrice: prod?.basePrice != null ? String(prod.basePrice) : "",
    collectionId: prod?.collectionId ?? "",
    compareAtPrice: prod?.compareAtPrice != null ? String(prod.compareAtPrice) : "",
  });

  useEffect(() => {
    if (isEdit && product) {
      const formValues = mapProductToForm(product);
      reset(formValues);
      setManualSlug(true); // editing: keep current slug unless user toggles
      setExistingImages(Array.isArray(product.images) ? product.images : []);
      if (editorRef.current) editorRef.current.innerHTML = product.description ?? "";
      descriptionRef.current = product.description ?? "";
      const mappedShades = Array.isArray(product.shades)
        ? product.shades.map((shade) => ({
            key: shade.id ?? generateShadeKey(),
            name: shade.name ?? "",
            hexColor: shade.hexColor ?? "#a855f7",
            sku: shade.sku ?? "",
            price:
              typeof shade.price === "string" || typeof shade.price === "number"
                ? String(shade.price)
                : "",
            quantity: shade.inventory?.quantity != null ? String(shade.inventory.quantity) : "",
          }))
        : [];
      setShadesState(mappedShades.length ? mappedShades : [createEmptyShade()]);
    }
  }, [isEdit, product, reset]);

  const handleAddShade = () => setShadesState((p) => [...p, createEmptyShade()]);
  const handleShadeChange = (key, field, value) =>
    setShadesState((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  const handleRemoveShade = (key) => setShadesState((prev) => prev.filter((s) => s.key !== key));

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    setImages(files);
  };

  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await request(`${API_BASE}/uploads`, { method: "POST", body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || "Image upload failed");
    }
    const data = await response.json();
    return data.url;
  };

  const applyFormatting = (command) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (typeof document !== "undefined") {
      document.execCommand(command, false, undefined);
      descriptionRef.current = editorRef.current.innerHTML; // no state update
    }
  };

  const clearDescriptionFile = () => {
    setDescriptionFileName("");
    if (textFileInputRef.current) textFileInputRef.current.value = "";
  };

  const handleDescriptionFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      descriptionRef.current = text;
      setDescriptionFileName(file.name);
      if (editorRef.current) editorRef.current.innerHTML = text;
      setValue("description", text, { shouldDirty: true });
    };
    reader.readAsText(file, "utf-8");
  };

  const currentStep = SECTIONS.findIndex((s) => s.value === activeTab);
  const goToPreviousSection = () => currentStep > 0 && setActiveTab(SECTIONS[currentStep - 1].value);
  const goToNextSection = () => currentStep < SECTIONS.length - 1 && setActiveTab(SECTIONS[currentStep + 1].value);

  const asOptionalString = (value) => {
    if (typeof value !== "string") return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  };
  const asOptionalNumber = (value) => {
    if (value == null || value === "") return undefined;
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const handleRemoveExistingImage = (imageId) =>
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const basePriceFloat = parseFloat(values.basePrice ?? "0");
      const basePrice = Number.isFinite(basePriceFloat) ? basePriceFloat : 0;

      let uploadedImages = [];
      if (images.length) {
        uploadedImages = await Promise.all(images.map((file) => uploadImageFile(file)));
      }

      const payloadImages = [
        ...existingImages.map((image) => ({ url: image.url })),
        ...uploadedImages.map((url) => ({ url })),
      ];

      const shadePayload = shadesState
        .map((shade) => ({
          name: shade.name?.trim() ?? "",
          hexColor: shade.hexColor?.trim() ?? "",
          sku: asOptionalString(shade.sku),
          price: asOptionalNumber(shade.price),
          quantity:
            shade.quantity !== undefined && shade.quantity !== ""
              ? Math.max(0, parseInt(shade.quantity, 10) || 0)
              : undefined,
        }))
        .filter((s) => s.name && s.hexColor);

      const endpointUrl = isEdit
        ? `${API_BASE}/products/${productId ?? product?.id}`
        : `${API_BASE}/products`;

      const response = await request(endpointUrl, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          slug: values.slug,
          description: asOptionalString(descriptionRef.current),
          finish: asOptionalString(values.finish),
          basePrice,
          collectionId: values.collectionId || undefined,
          images: payloadImages.length ? payloadImages : undefined,
          shades: shadePayload.length ? shadePayload : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || body?.error || "Failed to create product";
        throw new Error(message);
      }

      refresh?.();
      toast.success(isEdit ? "Product updated" : "Product created");
      if (typeof afterSubmit === "function") afterSubmit();
      else if (isDialog) onClose(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const headerPadding = isDialog ? "px-6 pb-4 pt-6" : "px-8 pb-6 pt-8";
  const formPadding = isDialog ? "px-6 pb-6" : "px-8 pb-10 lg:px-10";
  const scrollAreaHeightClass = "h-[calc(92vh-260px)] md:h-[calc(92vh-220px)]";

  const ScrollContainer = ({ className = "", children, allowScroll = false }) => {
    if (isDialog) {
      return (
        <ScrollArea className={`${allowScroll ? "max-h-96" : scrollAreaHeightClass} pr-3 md:pr-4 ${className}`}>
          {children}
        </ScrollArea>
      );
    }
    return <div className={`pr-1 md:pr-2 lg:pr-3 ${className}`}>{children}</div>;
  };

  const contentHeader = isDialog ? (
    <DialogHeader className={`border-b border-border/60 text-left ${headerPadding}`}>
      <DialogTitle>Add new product</DialogTitle>
      <DialogDescription>
        Provide product details, pricing, and imagery to publish this item to your catalogue.
      </DialogDescription>
    </DialogHeader>
  ) : (
    <div className={`border-b border-border/60 text-left ${headerPadding}`}>
      <h2 className="text-2xl font-semibold text-primary">Add new product</h2>
      <p className="text-sm text-muted-foreground">
        Provide product details, pricing, and imagery to publish this item to your catalogue.
      </p>
    </div>
  );

  const content = (
    <div className={`flex flex-col ${isDialog ? "h-full overflow-hidden" : ""}`}>
      {contentHeader}
      <form
        id={resolvedFormId}
        onSubmit={handleSubmit(onSubmit)}
        className={`flex flex-col gap-6 ${isDialog ? "flex-1 min-h-0 overflow-hidden" : "overflow-visible"} ${formPadding}`}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className={`flex flex-col gap-4 ${isDialog ? "flex-1 min-h-0" : ""} ${isDialog ? "" : "mt-4"}`}
        >
          <div className={isDialog ? "md:hidden" : ""}>
            <TabsList className={`${isDialog ? "grid grid-cols-2" : "flex flex-wrap"} gap-2 rounded-2xl bg-muted/30 p-1`}>
              {SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className={`rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${
                    isDialog ? "" : "md:text-sm"
                  }`}
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className={`flex flex-col gap-4 md:flex-row md:items-start md:gap-6 ${isDialog ? "flex-1 min-h-0" : ""}`}>
            {isDialog ? (
              <div className="hidden md:flex w-64 flex-shrink-0 flex-col gap-3 rounded-3xl bg-muted/20 p-4 shadow-sm">
                <TabsList className="flex flex-col gap-3">
                  {SECTIONS.map((section, index) => (
                    <TabsTrigger
                      key={section.value}
                      value={section.value}
                      className="w-full justify-start rounded-2xl border border-transparent bg-white px-4 py-3 text-left text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm data-[state=active]:text-primary"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Step {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{section.label}</span>
                        <span className="text-xs text-muted-foreground">{section.description}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            ) : null}

            <div className={`flex-1 min-w-0 rounded-3xl border border-border/40 bg-white/95 px-1 py-1 md:px-4 ${isDialog ? "min-h-0 overflow-hidden" : "overflow-visible"}`}>
              {/* DETAILS */}
              <TabsContent value="details" forceMount className="h-full">
                <ScrollContainer className="space-y-6 pb-6">
                  <div className="space-y-6 pb-6">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle>Description</CardTitle>
                        <CardDescription>Tell customers what makes this product special.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* NAME (uncontrolled; updates slug when auto) */}
                          <div className="space-y-2">
                            <Label htmlFor="product-name">Product name</Label>
                            <Input
                              id="product-name"
                              autoComplete="off"
                              required
                              {...register("name", {
                                required: true,
                                onChange: (e) => {
                                  if (!manualSlug) {
                                    setValue("slug", slugify(e.target.value), { shouldDirty: true });
                                  }
                                },
                              })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="product-finish">Finish</Label>
                            <Input id="product-finish" placeholder="Matte, satin, glossy..." autoComplete="off" {...register("finish")} />
                          </div>

                          {/* SLUG (uncontrolled; no watch/value prop) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="product-slug">Slug</Label>
                              <button
                                type="button"
                                className="text-xs font-semibold text-primary"
                                onClick={() => {
                                  setManualSlug((prev) => {
                                    const next = !prev;
                                    if (!next) {
                                      const nameNow = getValues("name") || "";
                                      setValue("slug", slugify(nameNow), { shouldDirty: true });
                                    }
                                    return next;
                                  });
                                }}
                              >
                                {manualSlug ? "Auto-generate" : "Edit manually"}
                              </button>
                            </div>
                            <Input
                              id="product-slug"
                              autoComplete="off"
                              aria-describedby="product-slug-help"
                              {...register("slug", {
                                onChange: (e) => {
                                  setManualSlug(true);
                                  const s = slugify(e.target.value);
                                  setValue("slug", s, { shouldDirty: true });
                                },
                              })}
                            />
                            <p id="product-slug-help" className="sr-only">Slug is used in the product URL.</p>
                          </div>

                          {/* Collection */}
                          <div className="space-y-2">
                            <Label id="product-collection-label">Collection</Label>
                            <Select
                              value={watch("collectionId")}
                              onValueChange={(value) => setValue("collectionId", value, { shouldDirty: true })}
                            >
                              <SelectTrigger id="product-collection" aria-labelledby="product-collection-label" name="collectionId">
                                <SelectValue placeholder="Optional" />
                              </SelectTrigger>
                              <SelectContent>
                                {collectionOptions.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* DESCRIPTION EDITOR */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span id="product-description-label" className="text-sm font-medium leading-none">Business description</span>
                            <div className="flex items-center gap-2">
                              {descriptionFileName ? (
                                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                  <span className="max-w-[140px] truncate">{descriptionFileName}</span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 text-primary hover:text-primary/80"
                                    onClick={clearDescriptionFile}
                                    aria-label="Remove uploaded file"
                                  >
                                    ×
                                  </Button>
                                </div>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-full border-primary/40 bg-primary/5 px-3 text-xs font-semibold text-primary transition hover:bg-primary/10"
                                onClick={() => textFileInputRef.current?.click()}
                                aria-describedby="product-description-help"
                              >
                                Upload .txt file
                              </Button>
                            </div>
                          </div>

                          <input
                            id="product-description-file"
                            type="file"
                            accept=".txt,text/plain"
                            ref={textFileInputRef}
                            onChange={handleDescriptionFile}
                            className="hidden"
                          />
                          <p id="product-description-help" className="text-xs text-muted-foreground">
                            Uploading a text file will replace the editor content with the file contents.
                          </p>

                          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format</span>
                            <div className="flex gap-1">
                              {FORMAT_ACTIONS.map((action) => (
                                <Button
                                  key={action.key}
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className={`h-8 w-8 rounded-full ${action.className}`}
                                  onClick={() => applyFormatting(action.key)}
                                  aria-label={`Make ${action.key}`}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div
                            id="product-description"
                            ref={editorRef}
                            className="min-h-[320px] max-h-[520px] overflow-auto rounded-2xl border border-primary/30 bg-white px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            contentEditable
                            tabIndex={0}
                            role="textbox"
                            aria-multiline="true"
                            aria-labelledby="product-description-label"
                            aria-describedby="product-description-help"
                            spellCheck
                            suppressContentEditableWarning
                            onInput={(e) => {
                              // No state updates here -> no scroll/caret jump
                              descriptionRef.current = e.currentTarget.innerHTML;
                            }}
                            onBlur={() => {
                              // Commit to RHF when the user leaves the editor
                              setValue("description", descriptionRef.current, { shouldDirty: true });
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use the toolbar to add bold, italic, or underlined emphasis. Rich text is saved with the product.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollContainer>
              </TabsContent>

              {/* INVENTORY */}
              <TabsContent value="inventory" forceMount className="h-full">
                <ScrollContainer className="space-y-6 pb-4" allowScroll>
                  <div className="space-y-6 pb-4">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle>Inventory & variants</CardTitle>
                        <CardDescription>Record stock information and SKU identifiers.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="inventory-quantity">Quantity (optional)</Label>
                            <Input id="inventory-quantity" type="number" min="0" placeholder="e.g. 120" {...register("inventoryQuantity")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inventory-sku">SKU (optional)</Label>
                            <Input id="inventory-sku" placeholder="UGG-BB-PUR-06" {...register("inventorySku")} />
                          </div>
                        </div>

                        {/* Selling type */}
                        <div className="space-y-3">
                          <span id="selling-type-label" className="text-sm font-medium">Selling type</span>
                          <div className="grid gap-3 md:grid-cols-3" role="group" aria-labelledby="selling-type-label">
                            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 shadow-sm">
                              <Checkbox
                                id="selling-instore"
                                checked={watch("inStoreSelling")}
                                onCheckedChange={(checked) => setValue("inStoreSelling", Boolean(checked))}
                              />
                              <Label htmlFor="selling-instore" className="text-sm font-medium">In-store selling only</Label>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 shadow-sm">
                              <Checkbox
                                id="selling-online"
                                checked={watch("onlineSelling")}
                                onCheckedChange={(checked) => setValue("onlineSelling", Boolean(checked))}
                              />
                              <Label htmlFor="selling-online" className="text-sm font-medium">Online selling only</Label>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 shadow-sm">
                              <Checkbox id="selling-both" disabled />
                              <Label htmlFor="selling-both" className="text-sm font-medium text-muted-foreground">Both in-store and online</Label>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          Product variants like shade or finish can be added once the product is created.
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <CardTitle>Shade variants</CardTitle>
                            <CardDescription>Capture popular shades with hex colors, SKU, and stock.</CardDescription>
                          </div>
                          <Button type="button" variant="outline" className="rounded-full" onClick={handleAddShade}>
                            Add shade
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {shadesState.length ? (
                          <div className="space-y-4">
                            {shadesState.map((shade) => {
                              const nameId = `${resolvedFormId}-${shade.key}-name`;
                              const hexTextId = `${resolvedFormId}-${shade.key}-hex-text`;
                              const hexPickerId = `${resolvedFormId}-${shade.key}-hex-picker`;
                              const skuId = `${resolvedFormId}-${shade.key}-sku`;
                              const priceId = `${resolvedFormId}-${shade.key}-price`;
                              const quantityId = `${resolvedFormId}-${shade.key}-quantity`;

                              return (
                                <div key={shade.key} className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                                  <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                      <Label htmlFor={nameId}>Shade name</Label>
                                      <Input
                                        id={nameId}
                                        autoComplete="off"
                                        value={shade.name}
                                        onChange={(e) => handleShadeChange(shade.key, "name", e.target.value)}
                                        placeholder="Velvet berry"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor={hexTextId}>Hex color</Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          id={hexPickerId}
                                          type="color"
                                          value={shade.hexColor || "#a21caf"}
                                          onChange={(e) => handleShadeChange(shade.key, "hexColor", e.target.value)}
                                          className="h-10 w-16 cursor-pointer rounded-full border border-border/60 px-1"
                                          aria-label="Shade color"
                                        />
                                        <Input
                                          id={hexTextId}
                                          autoComplete="off"
                                          value={shade.hexColor}
                                          onChange={(e) => handleShadeChange(shade.key, "hexColor", e.target.value)}
                                          placeholder="#a21caf"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor={skuId}>SKU (optional)</Label>
                                      <Input
                                        id={skuId}
                                        autoComplete="off"
                                        value={shade.sku}
                                        onChange={(e) => handleShadeChange(shade.key, "sku", e.target.value)}
                                        placeholder="SKU-001"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                      <Label htmlFor={priceId}>Shade price (optional)</Label>
                                      <Input
                                        id={priceId}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        autoComplete="off"
                                        value={shade.price}
                                        onChange={(e) => handleShadeChange(shade.key, "price", e.target.value)}
                                        placeholder="799"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label htmlFor={quantityId}>Initial quantity</Label>
                                      <Input
                                        id={quantityId}
                                        type="number"
                                        min="0"
                                        autoComplete="off"
                                        value={shade.quantity}
                                        onChange={(e) => handleShadeChange(shade.key, "quantity", e.target.value)}
                                        placeholder="150"
                                      />
                                    </div>
                                    <div className="flex items-end justify-end">
                                      <Button type="button" variant="ghost" className="text-destructive" onClick={() => handleRemoveShade(shade.key)}>
                                        Remove shade
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                            No shades added yet. Use the button above to create variants for each lipstick shade.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollContainer>
              </TabsContent>

              {/* MEDIA */}
              <TabsContent value="media" forceMount className="h-full">
                <ScrollContainer className="space-y-4 pb-4" allowScroll>
                  <div className="space-y-6 pb-4">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle>Product images</CardTitle>
                        <CardDescription>Upload polished imagery to bring the product to life.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 p-6 text-center transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          aria-describedby="product-images-help"
                        >
                          <p className="text-sm font-semibold text-primary">Click or drag image files to upload</p>
                          <p id="product-images-help" className="text-xs text-muted-foreground">Supports PNG, JPG, GIF up to 10MB each.</p>
                        </button>
                        <Input
                          ref={imageInputRef}
                          id="product-images"
                          name="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        {existingImages.length ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Existing gallery</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                              {existingImages.map((image) => (
                                <div key={image.id ?? image.url} className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
                                  <img src={image.url} alt={image.alt ?? image.url} className="h-32 w-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-destructive shadow"
                                    onClick={() => handleRemoveExistingImage(image.id ?? image.url)}
                                    aria-label="Remove image"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {images.length ? (
                          <ScrollArea className="h-32 rounded-lg border border-border/60" aria-label="Selected images to upload">
                            <ul className="space-y-1 p-3 text-xs text-muted-foreground">
                              {images.map((file) => (
                                <li key={file.name}>{file.name}</li>
                              ))}
                            </ul>
                          </ScrollArea>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollContainer>
              </TabsContent>

              {/* SHIPPING */}
              <TabsContent value="shipping" forceMount className="h-full">
                <ScrollContainer className="space-y-5 pb-5" allowScroll>
                  <div className="space-y-6 pb-4">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle>Shipping & delivery</CardTitle>
                        <CardDescription>Provide optional measurements to streamline fulfilment.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="shipping-weight">Item weight</Label>
                          <div className="flex items-center gap-3">
                            <Input id="shipping-weight" type="number" min="0" step="0.01" placeholder="12" {...register("shippingWeight")} className="flex-1" />
                            <div className="flex items-center gap-2">
                              <span id="shipping-weight-unit-label" className="sr-only">Weight unit</span>
                              <Select defaultValue="kg">
                                <SelectTrigger id="shipping-weight-unit" aria-labelledby="shipping-weight-unit-label" name="shippingWeightUnit" className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="lb">lb</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span id="package-size-label" className="text-sm font-medium">Package size (cm)</span>
                          <div className="grid gap-3 md:grid-cols-3" role="group" aria-labelledby="package-size-label">
                            <div className="space-y-1.5">
                              <Label htmlFor="package-length">Length</Label>
                              <Input id="package-length" placeholder="Length" type="number" min="0" step="0.1" autoComplete="off" {...register("shippingLength")} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="package-width">Width</Label>
                              <Input id="package-width" placeholder="Width" type="number" min="0" step="0.1" autoComplete="off" {...register("shippingWidth")} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="package-height">Height</Label>
                              <Input id="package-height" placeholder="Height" type="number" min="0" step="0.1" autoComplete="off" {...register("shippingHeight")} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollContainer>
              </TabsContent>

              {/* PRICING */}
              <TabsContent value="pricing" forceMount className="h-full">
                <ScrollContainer className="space-y-6 pb-4" allowScroll>
                  <div className="space-y-6 pb-4">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle>Pricing</CardTitle>
                        <CardDescription>Define retail pricing and optional compare-at pricing.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Price</Label>
                          <Input id="product-price" type="number" min="0" step="0.01" placeholder="0.00" {...register("basePrice")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="compare-price">Compare at price</Label>
                          <Input id="compare-price" type="number" min="0" step="0.01" placeholder="Optional" {...register("compareAtPrice")} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollContainer>
              </TabsContent>
            </div>
          </div>
        </Tabs>

        <div className="mt-2 flex flex-col gap-3 border-t border-border/60 pt-4 md:mt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={goToPreviousSection} disabled={currentStep <= 0}>
              Previous
            </Button>
            <Button type="button" variant="ghost" onClick={goToNextSection} disabled={currentStep >= SECTIONS.length - 1}>
              Next
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={submitting}>
              Discard
            </Button>
            <Button type="button" variant="secondary" disabled={submitting}>
              Schedule
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add product"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );

  if (isDialog) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[92vh] w-[92vw] max-w-5xl overflow-hidden rounded-3xl p-0">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex w-full flex-col overflow-visible rounded-3xl border border-border/60 bg-white/95 shadow-xl">
      {content}
    </div>
  );
}

export function ProductDialog({ onClose = () => {}, ...props }) {
  return (
    <ProductFormBase
      {...props}
      onClose={onClose}
      layout="dialog"
      afterSubmit={() => onClose(false)}
    />
  );
}

export function ProductForm(props) {
  return <ProductFormBase {...props} layout="page" />;
}
