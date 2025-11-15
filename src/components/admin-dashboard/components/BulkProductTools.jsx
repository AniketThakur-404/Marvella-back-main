import { useRef, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import { API_BASE } from "../utils";

export function BulkProductTools({ request, refresh }) {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Select a JSON file first.");
      return;
    }
    try {
      setError("");
      setImporting(true);
      const text = await file.text();
      const json = JSON.parse(text);
      const items = Array.isArray(json) ? json : json.items;
      if (!Array.isArray(items) || !items.length) {
        throw new Error("File must contain an array of products.");
      }

      const response = await request(`${API_BASE}/products/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Bulk import failed");
      }
      const result = await response.json();
      setSummary(result);
      toast.success(`Imported ${result.created} created / ${result.updated} updated`);
      refresh?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to import file");
      toast.error(err.message || "Unable to import file");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await request(`${API_BASE}/products/export`, {
        method: "GET",
      });
      if (!response.ok) {
        const body = await response.text().catch(() => null);
        throw new Error(body || "Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export ready");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Unable to export products");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-3xl border border-border/60 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Bulk import</CardTitle>
          <CardDescription>Upload a JSON file containing an array of product objects.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-products">JSON file</Label>
            <Input
              id="bulk-products"
              type="file"
              accept="application/json"
              ref={fileInputRef}
              disabled={importing}
            />
          </div>
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <p>Each product should include at least: name, slug, basePrice.</p>
            <p>Optional fields: description, collectionId, images (url), shades (name, hexColor, sku, price, quantity).</p>
          </div>
          {error ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Button onClick={handleImport} disabled={importing} className="rounded-full">
            {importing ? "Importing…" : "Import products"}
          </Button>
          {summary ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <p>
                Created: <span className="font-semibold text-primary">{summary.created}</span>
              </p>
              <p>
                Updated: <span className="font-semibold text-primary">{summary.updated}</span>
              </p>
              <p>
                Failed: <span className="font-semibold text-destructive">{summary.failed}</span>
              </p>
              {summary.results?.length ? (
                <ScrollArea className="mt-2 h-28 rounded-xl border border-border/60 bg-white px-3 py-2">
                  <ul className="space-y-1 text-xs">
                    {summary.results.map((result, index) => (
                      <li key={`${result.slug}-${index}`}>
                        <strong>{result.slug}</strong>: {result.status}
                        {result.message ? ` – ${result.message}` : ""}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border/60 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Export catalogue</CardTitle>
          <CardDescription>Download a CSV snapshot of all products, prices, and shades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            CSV columns include name, slug, price, collection, shade names/SKUs/quantities. Suitable for reports or offline edits.
          </div>
          <Button onClick={handleExport} disabled={exporting} className="rounded-full">
            {exporting ? "Preparing…" : "Export as CSV"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
