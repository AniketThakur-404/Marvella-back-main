"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppSidebar } from "@/components/admin-dashboard/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

import { DashboardHeader } from "./components/DashboardHeader";
import { ManagementPanel } from "./components/ManagementPanel";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { ProductPerformancePanel } from "./components/ProductPerformancePanel";
import { InventoryControlPanel } from "./components/InventoryControlPanel";
import { CustomerInsightsPanel } from "./components/CustomerInsightsPanel";
import { MarketingInsightsPanel } from "./components/MarketingInsightsPanel";
import { RealTimeOperationsPanel } from "./components/RealTimeOperationsPanel";
import { OperationsSuitePanel } from "./components/OperationsSuitePanel";
import { AiAndSegmentationPanel } from "./components/AiAndSegmentationPanel";
import { MarketingAssetsPanel } from "./components/MarketingAssetsPanel";
import { CustomizationFeedbackPanel } from "./components/CustomizationFeedbackPanel";
import { HistoricalTrendsPanel } from "./components/HistoricalTrendsPanel";
import { BulkProductTools } from "./components/BulkProductTools";
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
    users,
    inventory,
    lowInventory,
    reviews,
    reviewMeta,
    stats,
    loading,
    refresh,
  } = useDashboardData(true, request);
  const goToNewProduct = () => navigate("/dashboard/products/new");

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

  const yearlySalesData = useMemo(() => {
    if (!products?.length) return [];
    const grouped = products.reduce((acc, product) => {
      const createdAt = product.createdAt ? new Date(product.createdAt) : null;
      const year = createdAt?.getFullYear() ?? new Date().getFullYear();
      if (!acc[year]) {
        acc[year] = { year, products: 0, revenue: 0 };
      }
      acc[year].products += 1;
      acc[year].revenue += toNumber(product.basePrice);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => a.year - b.year)
      .slice(-4)
      .map((entry) => ({
        ...entry,
        revenue: Number(entry.revenue.toFixed(2)),
      }));
  }, [products]);

  const customerBreakdown = useMemo(() => {
    if (!users?.length) return [];
    const counts = users.reduce((acc, current) => {
      const domain = current.email?.split("@")?.[1] ?? "unknown";
      acc[domain] = (acc[domain] ?? 0) + 1;
      return acc;
    }, {});
    const total = users.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: Math.round((count / total) * 100),
      }));
  }, [users]);

  const recentProducts = useMemo(() => {
    return products
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? Date.now()) - new Date(a.createdAt ?? Date.now())
      )
      .slice(0, 5);
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
  const totalSentiment = sentimentBuckets.positive + sentimentBuckets.neutral + sentimentBuckets.negative;
  const sentimentScore = totalSentiment
    ? Math.round((sentimentBuckets.positive / totalSentiment) * 100)
    : 82;

  const shadeStats = (shades || [])
    .map((shade) => ({
      name: shade.name,
      quantity: shade.inventory?.quantity ?? 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const inventoryStats = [
    {
      label: "Total SKUs",
      value: shades?.length ?? 0,
      detail: "Unique lip shades",
    },
    {
      label: "Catalog units",
      value: stats.totalInventory,
      detail: "Tracked across inventory",
    },
    {
      label: "Low stock",
      value: lowInventory?.length ?? 0,
      detail: "Need replenishment",
    },
  ];

  const lowStockItems = (lowInventory?.length ? lowInventory : inventory || [])
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.product?.name ?? item.shade?.name ?? "SKU",
      collection: item.product?.collection?.name,
      quantity: item.quantity ?? 0,
      sku: item.shade?.sku,
    }));

  const topShadeSwatches = products
    .slice(0, 3)
    .map((product, index) => ({
      id: product.id,
      name: product.name,
      swatch: product.swatch ?? ["#b91c1c", "#be123c", "#db2777"][index % 3],
      share: Math.round(100 / Math.max(1, Math.min(products.length, 5))) + index,
    }));

  const campaignData = useMemo(
    () => [
      { id: "spring", name: "Spring satin drop", channel: "Instagram", roi: 142, progress: 68, goal: "Goal ₹3L", conversions: 182 },
      { id: "festive", name: "Festive matte relaunch", channel: "Email + SMS", roi: 118, progress: 54, goal: "Goal ₹2L", conversions: 139 },
      { id: "influencer", name: "Influencer capsules", channel: "Influencer", roi: 167, progress: 72, goal: "Goal ₹4L", conversions: 204 },
    ],
    []
  );

  const influencerHighlights = useMemo(
    () => [
      { id: "mira", name: "Mira Shah", platform: "Instagram", summary: "Posted ombré swatch reels featuring Marvelle mattes.", reach: "480K", engagement: 6.5 },
      { id: "theliplab", name: "The Lip Lab", platform: "YouTube", summary: "Full-day wear test comparing Marvelle satin vs legacy brand.", reach: "220K", engagement: 5.1 },
    ],
    []
  );


  const roleData = [
    { id: "merch", name: "Merchandising", members: 4, scope: "Can edit products & shades", permissions: ["catalogue", "pricing", "assets"] },
    { id: "marketing", name: "Marketing", members: 3, scope: "Runs campaigns, exports reports", permissions: ["campaigns", "exports"] },
    { id: "ops", name: "Operations", members: 5, scope: "Handles inventory + returns", permissions: ["inventory", "returns"] },
    { id: "support", name: "Support", members: 2, scope: "Moderates reviews, issues refunds", permissions: ["reviews", "refunds"] },
  ];

  const alertsData = [
    { id: "low-stock", title: "Low stock: Velvet Berry", detail: "Shade qty < 12 units", channel: "Email", variant: "danger" },
    { id: "review", title: "New 2★ review", detail: "Escalate to CX within 2 hrs", channel: "Slack", variant: "warning" },
    { id: "milestone", title: "₹5L revenue sprint", detail: "Hit 80% of the weekly goal", channel: "Push", variant: "success" },
  ];

  const returnQueue = [
    { id: "ret-1", product: "Matte Muse", reason: "Damaged bullet", days: 2 },
    { id: "ret-2", product: "Satin Bloom", reason: "Shade mismatch", days: 5 },
  ];

  const aiInsights = [
    { id: "ai-1", title: "Restock Chrome Orchid by 220 units", detail: "Projected sell-out in 9 days", confidence: 86 },
    { id: "ai-2", title: "Launch ombré duo pack", detail: "Expected lift +18% among Gen Z", confidence: 73 },
  ];

  const segmentationData = [
    { id: "seg-1", name: "Matte loyalists", size: "4.5k", criteria: "Purchased 3+ mattes in 90 days", tags: ["LOYAL", "AOV ₹1.8k"] },
    { id: "seg-2", name: "Trial shoppers", size: "2.1k", criteria: "First purchase < 30 days", tags: ["NEW", "WELCOME FLOW"] },
    { id: "seg-3", name: "Influencer referrals", size: "1.3k", criteria: "Came via code MARVELLE15", tags: ["HIGH AOV", "SOCIAL"] },
  ];

  const assets = [
    {
      id: "asset-1",
      name: "Holiday hero",
      type: "Campaign banner",
      channel: "Web",
      preview: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "asset-2",
      name: "Matte muse reel",
      type: "Video",
      channel: "Instagram",
      preview: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=60",
    },
    {
      id: "asset-3",
      name: "Influencer kit",
      type: "Press pack",
      channel: "Dropbox",
      preview: "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&w=600&q=60",
    },
  ];

  const marketingBreakdown = [
    { id: "mkt-1", channel: "Instagram Sparkle drip", icon: "reel", roi: 135, detail: "Top of funnel shade teasers", spend: "₹1.2L" },
    { id: "mkt-2", channel: "YouTube wear test", icon: "video", roi: 162, detail: "Long-form review with creators", spend: "₹80k" },
  ];

  const feedbackChips = [
    { id: "feed-1", label: "Bulk price edit" },
    { id: "feed-2", label: "Better AR preview" },
    { id: "feed-3", label: "Shade duplication" },
  ];

  const historicalChartData = useMemo(() => {
    const months = monthlySalesData.slice(-12);
    const extended = [
      ...months,
      ...months.map((entry, idx) => ({
        ...entry,
        label: `${entry.month} ${new Date().getFullYear() - 1}`,
        value: entry.revenue * (0.8 + idx * 0.01),
      })),
    ];
    return {
      "12m": months.map((entry) => ({ label: entry.month, value: entry.revenue })),
      "24m": extended.slice(-24).map((entry) => ({ label: entry.month ?? entry.label, value: entry.revenue ?? entry.value })),
      "36m": extended
        .concat(
          months.map((entry) => ({
            label: entry.month,
            value: entry.revenue * 0.7,
          }))
        )
        .slice(-36),
    };
  }, [monthlySalesData]);

  const operationsFeed = [
    ...recentProducts.map((product) => ({
      id: `product-${product.id}`,
      title: `New SKU: ${product.name}`,
      description: "Product added to catalog",
      time: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "Just now",
    })),
    ...lowStockItems.map((item) => ({
      id: `low-${item.id}`,
      title: `${item.name} below threshold`,
      description: `${item.quantity} units remaining`,
      time: "4 min ago",
    })),
  ].slice(0, 6);

  const summaryData = {
    formattedMonthlyRevenue: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(monthlyRevenue),
    monthlyGrowth,
    monthlyOrders,
    weeklyOrders,
    dailyOrders,
    activeCampaigns: campaignData.length,
    topCampaign: campaignData[0]?.name,
    sentimentScore,
    sentimentPositive: totalSentiment ? Math.round((sentimentBuckets.positive / totalSentiment) * 100) : 72,
    sentimentNegative: totalSentiment ? Math.round((sentimentBuckets.negative / totalSentiment) * 100) : 8,
  };

  const sentimentPanel = {
    score: sentimentScore,
    delta: monthlyGrowth / 5,
    positive: summaryData.sentimentPositive,
    negative: summaryData.sentimentNegative,
  };

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [historicalRange, setHistoricalRange] = useState("12m");

  return (
    <SidebarProvider>
      {/* Two-column, responsive layout. Sidebar is a sticky, non-overlapping column. */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar column */}
        <AppSidebar />

        {/* Content column */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[#f5f7fb]">
          {/* Mobile trigger bar (hidden on md+) */}
          <div className="sticky top-0 z-20 grid grid-cols-[auto,1fr] items-center gap-2 border-b bg-[#f5f7fb]/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#f5f7fb]/60 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <span className="text-sm font-medium text-primary/80">Menu</span>
          </div>

          <DashboardHeader onCreateProduct={goToNewProduct} />

          <main className="flex-1 space-y-8 px-4 pb-12 pt-6 md:px-8">
            <ExecutiveSummary summary={summaryData} onCreateProduct={goToNewProduct} />

            <ProductPerformancePanel
              monthlySalesData={monthlySalesData}
              shadeStats={shadeStats}
              loading={loading}
            />

            <InventoryControlPanel inventoryStats={inventoryStats} lowStockItems={lowStockItems} />

            <CustomerInsightsPanel
              customerBreakdown={customerBreakdown}
              sentiment={sentimentPanel}
              topProducts={topShadeSwatches}
            />

            <MarketingInsightsPanel campaigns={campaignData} influencerHighlights={influencerHighlights} />

            <OperationsSuitePanel
              roles={roleData}
              alerts={alertsData}
              returns={returnQueue}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={setNotificationsEnabled}
            />

            <BulkProductTools request={request} refresh={refresh} />

            <AiAndSegmentationPanel aiInsights={aiInsights} segments={segmentationData} />

            <MarketingAssetsPanel assets={assets} marketingBreakdown={marketingBreakdown} />

            <CustomizationFeedbackPanel
              darkMode={darkMode}
              onToggleDarkMode={setDarkMode}
              feedbackItems={feedbackChips}
            />

            <HistoricalTrendsPanel
              historicalData={historicalChartData}
              range={historicalRange}
              onRangeChange={setHistoricalRange}
            />

            <RealTimeOperationsPanel
              events={operationsFeed}
              autoRefresh={autoRefresh}
              onToggleRefresh={setAutoRefresh}
            />

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
