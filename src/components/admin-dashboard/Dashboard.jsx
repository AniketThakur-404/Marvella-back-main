"use client";

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { AppSidebar } from "@/components/admin-dashboard/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

import { DashboardHeader } from "./components/DashboardHeader";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { InventoryControlPanel } from "./components/InventoryControlPanel";
import { ManagementPanel } from "./components/ManagementPanel";
import { monthFormatter, toNumber } from "./utils";

const defaultRequest = (url, options) => fetch(url, options);

export default function Dashboard() {
  const { authFetch } = useAuth();
  const request = authFetch ?? defaultRequest;
  const navigate = useNavigate();
  const {
    products,
    collections,
    shades,
    inventory,
    lowInventory,
    reviews,
    reviewMeta,
    stats,
    loading,
    refresh,
  } = useDashboardData(true, request);

  const goToNewProduct = () => navigate("/dashboard/products/new");

  useEffect(() => {
    const handler = () => refresh?.();
    window.addEventListener("dashboard:data:refresh", handler);
    return () => window.removeEventListener("dashboard:data:refresh", handler);
  }, [refresh]);

  const monthlySalesData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, idx) => {
      const label = monthFormatter.format(new Date(currentYear, idx, 1));
      const items = products.filter((product) => {
        if (!product?.createdAt) return false;
        const created = new Date(product.createdAt);
        return created.getMonth() === idx && created.getFullYear() === currentYear;
      });
      const revenue = items.reduce(
        (total, product) => total + toNumber(product.basePrice),
        0
      );
      return {
        month: label,
        products: items.length,
        revenue: Number(revenue.toFixed(2)),
      };
    });
  }, [products]);

  const currentMonthIndex = new Date().getMonth();
  const monthlyRevenue = monthlySalesData[currentMonthIndex]?.revenue ?? 0;
  const prevRevenue = monthlySalesData[(currentMonthIndex + 11) % 12]?.revenue ?? 0;
  const monthlyGrowth = prevRevenue > 0 ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const monthlyOrders = monthlySalesData[currentMonthIndex]?.products ?? 0;
  const weeklyOrders = Math.max(1, Math.round(monthlyOrders / 4) || 0);
  const dailyOrders = Math.max(1, Math.round(weeklyOrders / 7) || 0);

  const sentimentBuckets = reviews.reduce(
    (acc, review) => {
      if (typeof review.rating !== "number") return acc;
      if (review.rating >= 4) acc.positive += 1;
      else if (review.rating <= 2) acc.negative += 1;
      else acc.neutral += 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
  const totalSentiment =
    sentimentBuckets.positive + sentimentBuckets.neutral + sentimentBuckets.negative;
  const sentimentScore = totalSentiment
    ? Math.round((sentimentBuckets.positive / totalSentiment) * 100)
    : 82;
  const sentimentPositive = totalSentiment
    ? Math.round((sentimentBuckets.positive / totalSentiment) * 100)
    : 72;
  const sentimentNegative = totalSentiment
    ? Math.round((sentimentBuckets.negative / totalSentiment) * 100)
    : 8;

  const inventoryStats = [
    {
      label: "Total SKUs",
      value: shades?.length ?? 0,
      detail: "Unique lip shades",
    },
    {
      label: "Catalog units",
      value: stats?.totalInventory ?? 0,
      detail: "Tracked across inventory",
    },
    {
      label: "Low stock",
      value: stats?.lowStockCount ?? lowInventory?.length ?? 0,
      detail: "Need replenishment",
    },
  ];

  const lowStockItems = (Array.isArray(lowInventory) && lowInventory.length ? lowInventory : inventory || [])
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.product?.name ?? item.shade?.name ?? "SKU",
      collection: item.product?.collection?.name,
      quantity: item.quantity ?? 0,
      sku: item.shade?.sku,
    }));

  const summaryData = {
    formattedMonthlyRevenue: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(monthlyRevenue),
    monthlyGrowth,
    monthlyOrders,
    weeklyOrders,
    dailyOrders,
    sentimentScore,
    sentimentPositive,
    sentimentNegative,
    catalogProducts: stats?.productCount ?? 0,
    catalogCollections: stats?.collectionCount ?? 0,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[#f5f7fb]">
          <div className="sticky top-0 z-20 grid grid-cols-[auto,1fr] items-center gap-2 border-b bg-[#f5f7fb]/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#f5f7fb]/60 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <span className="text-sm font-medium text-primary/80">Menu</span>
          </div>

          <DashboardHeader onCreateProduct={goToNewProduct} />

          <main className="flex-1 space-y-8 px-4 pb-12 pt-6 md:px-8">
            <ExecutiveSummary summary={summaryData} onCreateProduct={goToNewProduct} />

            <InventoryControlPanel inventoryStats={inventoryStats} lowStockItems={lowStockItems} />

            <ManagementPanel
              products={products}
              collections={collections}
              shades={shades}
              inventory={inventory}
              reviews={reviews}
              reviewMeta={reviewMeta}
              refresh={refresh}
              request={request}
              loading={loading}
              onCreateProduct={goToNewProduct}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
