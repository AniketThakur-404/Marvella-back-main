import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    User, Package, MapPin, Heart, Settings, LogOut, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: "Overview", path: "/profile" },
    { icon: Package, label: "Orders", path: "/profile/orders" },
    { icon: MapPin, label: "Addresses", path: "/profile/addresses" },
    { icon: Heart, label: "Wishlist", path: "/profile/wishlist" }, // Re-using existing wishlist or new page? We'll link to existing drawer or new page. Let's make a page.
    { icon: Settings, label: "Settings", path: "/profile/settings" },
];

export default function ProfileLayout() {
    const location = useLocation();
    const currentPath = location.pathname;
    const { user, logout } = useAuth();

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "U";
    const displayName = user?.name || "Guest";
    const displayEmail = user?.email || "Not signed in";

    return (
        <div className="min-h-screen bg-[var(--accent)] pt-20 md:pt-24 pb-12">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 shrink-0 space-y-8">
                        <div className="flex items-center gap-4 px-2">
                            <div className="h-12 w-12 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xl font-bold">
                                {initials}
                            </div>
                            <div>
                                <h2 className="font-bold text-[var(--primary)]">{displayName}</h2>
                                <p className="text-sm text-[var(--muted-foreground)]">{displayEmail}</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {MENU_ITEMS.map((item) => {
                                const isActive = currentPath === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                                                : "text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--primary)]"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all duration-200 mt-4"
                            >
                                <LogOut className="h-4 w-4" />
                                Log Out
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-h-[500px] rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 shadow-sm">
                        <Outlet />
                    </main>

                </div>
            </div>
        </div>
    );
}
