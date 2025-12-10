import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { readOrders } from "@/lib/orderStorage";
import { readAddresses } from "@/lib/addressStorage";

export default function ProfileOverview() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);

    useEffect(() => {
        setOrders(readOrders());
        setAddresses(readAddresses());
    }, []);

    const latestOrder = useMemo(
        () => (Array.isArray(orders) && orders.length ? orders[0] : null),
        [orders]
    );

    const addressCount = Array.isArray(addresses) ? addresses.length : 0;
    const cardCount = 0; // Placeholder for saved cards
    const totalOrders = Array.isArray(orders) ? orders.length : 0;
    const displayName = user?.name || "Guest";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Overview</h1>
                <p className="text-[var(--muted-foreground)]">Welcome back, {displayName}!</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-2xl bg-[var(--accent)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-[var(--card)] text-[var(--primary)]">
                            <Package className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-[var(--muted-foreground)]">Total Orders</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">{totalOrders}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--accent)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-[var(--card)] text-[var(--primary)]">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-[var(--muted-foreground)]">Saved Addresses</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">{addressCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--accent)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-[var(--card)] text-[var(--primary)]">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-[var(--muted-foreground)]">Saved Cards</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--primary)]">{cardCount}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--primary)]">Recent Order</h2>
                    <Link to="/profile/orders" className="text-sm font-medium text-[var(--primary)] hover:underline">
                        View All
                    </Link>
                </div>
                {latestOrder ? (
                    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-lg bg-[var(--secondary-100)] flex items-center justify-center text-xs font-bold text-[var(--secondary-400)]">
                                {latestOrder.items?.[0]?.name?.slice(0, 3)?.toUpperCase() || "ORD"}
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--primary)]">
                                    Order #{latestOrder.number || latestOrder.id}
                                </h3>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Placed on {new Date(latestOrder.createdAt || Date.now()).toLocaleDateString()}
                                </p>
                                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                    {latestOrder.status || "Pending"}
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-full border-[var(--border)]">
                            Track Order
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-sm text-[var(--muted-foreground)]">
                        No orders yet. Your recent order will show up here once you place one.
                    </div>
                )}
            </div>
        </div>
    );
}
