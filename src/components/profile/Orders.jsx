import React from "react";
import { Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDERS = [
    { id: "ORD-2024-001", date: "Oct 24, 2024", total: "₹2,499", status: "Delivered", items: 3 },
    { id: "ORD-2024-002", date: "Sep 12, 2024", total: "₹1,850", status: "Processing", items: 1 },
    { id: "ORD-2024-003", date: "Aug 05, 2024", total: "₹5,200", status: "Cancelled", items: 4 },
];

export default function Orders() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[var(--primary)]">Order History</h1>
            <div className="space-y-4">
                {ORDERS.map((order) => (
                    <div key={order.id} className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:shadow-sm transition-shadow">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-full bg-[var(--secondary-100)] text-[var(--primary)]">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--primary)]">{order.id}</h3>
                                    <p className="text-sm text-[var(--muted-foreground)]">{order.date} • {order.items} items</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                                                order.status === "Processing" ? "bg-amber-100 text-amber-700" :
                                                    "bg-rose-100 text-rose-700"
                                            }`}>
                                            {order.status}
                                        </span>
                                        <span className="text-sm font-medium text-[var(--primary)]">{order.total}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                                View Details <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
