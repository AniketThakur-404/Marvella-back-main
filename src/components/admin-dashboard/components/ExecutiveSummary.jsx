import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExecutiveSummary({ summary, onCreateProduct }) {
  const cards = [
    {
      label: "Monthly revenue",
      value: summary.formattedMonthlyRevenue,
      detail: `${summary.monthlyGrowth >= 0 ? "+" : ""}${summary.monthlyGrowth.toFixed(1)}% vs last month`,
    },
    {
      label: "Orders processed",
      value: summary.monthlyOrders,
      detail: `${summary.weeklyOrders} this week / ${summary.dailyOrders} today`,
    },
    {
      label: "Catalog ready",
      value: summary.catalogProducts,
      detail: `${summary.catalogCollections} collections live`,
    },
    {
      label: "Customer sentiment",
      value: `${summary.sentimentScore}% happy`,
      detail: `${summary.sentimentPositive}% positive / ${summary.sentimentNegative}% negative`,
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-3xl border border-border/60 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
              {card.label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold text-primary">{card.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{card.detail}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="rounded-3xl border border-dashed border-border/70 bg-gradient-to-r from-[#f3e8ff] via-white to-[#fdeee0] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Need to add a product?</CardTitle>
          <CardDescription>Launch a new lipstick SKU with full catalog metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onCreateProduct} className="rounded-full">Create product</Button>
        </CardContent>
      </Card>
    </section>
  );
}
