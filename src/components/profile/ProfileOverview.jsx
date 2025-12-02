import React from "react";
import { Link } from "react-router-dom";
import { Package, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileOverview() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Overview</h1>
                <p className="text-[var(--muted-foreground)]">Welcome back, Jane!</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-2xl bg-[var(--accent)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-[var(--card)] text-[var(--primary)]">
                            <Package className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-[var(--muted-foreground)]">Total Orders</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">12</div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--accent)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-[var(--card)] text-[var(--primary)]">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-[var(--muted-foreground)]">Saved Addresses</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">3</div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--accent)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-[var(--card)] text-[var(--primary)]">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-[var(--muted-foreground)]">Saved Cards</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">2</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--primary)]">Recent Order</h2>
                    <Link to="/profile/orders" className="text-sm font-medium text-[var(--primary)] hover:underline">
                        View All
                    </Link>
                </div>
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-[var(--secondary-100)] flex items-center justify-center text-xs font-bold text-[var(--secondary-400)]">
                            IMG
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--primary)]">Order #ORD-2024-001</h3>
                            <p className="text-sm text-[var(--muted-foreground)]">Placed on Oct 24, 2024</p>
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Delivered
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-full border-[var(--border)]">
                        Track Order
                    </Button>
                </div>
            </div>
        </div>
    );
}
