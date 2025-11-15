import { Bell, Plus, Search, Settings, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader({ onCreateProduct }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border bg-white/95 px-6 py-6 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3 text-primary">
        <SidebarTrigger className="lg:hidden rounded-full border border-primary/20 bg-primary/10 p-2 text-primary shadow-sm" />
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-semibold leading-tight text-primary">
            Admin dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor catalogue health and operational insights at a glance.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50" />
          <Input
            placeholder="Search products, shades or orders..."
            className="rounded-full border border-border/70 bg-white/95 pl-10 text-sm text-foreground shadow-sm transition focus-visible:ring-primary/40"
            type="search"
          />
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <Button
            onClick={onCreateProduct}
            className="hidden items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow lg:flex"
          >
            <Plus className="h-4 w-4" />
            New product
          </Button>
          <Button
            onClick={onCreateProduct}
            size="icon"
            className="flex h-10 w-10 rounded-full bg-primary/10 text-primary shadow-sm lg:hidden"
            title="Create product"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-10 w-10 rounded-full border border-border/60 bg-white text-primary shadow-sm sm:flex"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-10 w-10 rounded-full border border-border/60 bg-white text-primary shadow-sm sm:flex"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-2.5 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              MA
            </div>
            <div className="hidden text-left text-xs font-medium leading-tight sm:block">
              <span className="block text-sm font-semibold text-primary">Marvelle Admin</span>
              <span className="text-muted-foreground">Operations</span>
            </div>
            <UserCircle className="h-5 w-5 text-primary sm:hidden" />
          </div>
        </div>
      </div>
    </header>
  );
}
