import { AlertTriangle, TruckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function InventoryControlPanel({ inventoryStats, lowStockItems }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <Card className="rounded-3xl border border-border/60 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Inventory command center</CardTitle>
          <CardDescription>Stock posture by SKU and collection.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inventoryStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border/60 bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-primary">Reorder queue</CardTitle>
            <CardDescription>Shades approaching stock-out.</CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5" />
            {lowStockItems.length}
          </Badge>
        </CardHeader>
        <CardContent className="px-0">
          {lowStockItems.length ? (
            <ScrollArea className="h-[260px] px-4">
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.collection ?? "Unassigned"}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-destructive">{item.quantity} units</p>
                      <p className="text-muted-foreground">SKU {item.sku ?? "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted-foreground">
              <TruckIcon className="h-10 w-10 text-secondary" />
              <p>Inventory levels look healthy right now.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
