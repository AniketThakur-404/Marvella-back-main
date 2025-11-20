"use client";

import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  LayoutDashboard,
  Layers3,
  LifeBuoy,
  Package,
  Palette,
  Settings,
  Sparkles,
  Users2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/use-sidebar";

const primaryNav = [
  { title: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Products", icon: Package, href: "/dashboard/products" },
  { title: "Collections", icon: Layers3, href: "/dashboard#management" },
  { title: "Shades", icon: Palette, href: "/dashboard#management" },
  { title: "Inventory", icon: Boxes, href: "/dashboard#management" },
  { title: "Customers", icon: Users2, href: "/dashboard#customers" },
];

const secondaryNav = [
  { title: "Settings", icon: Settings, href: "/dashboard#settings" },
  { title: "Support", icon: LifeBuoy, href: "mailto:support@marvelle.com" },
];

// Resizable sidebar bounds (desktop)
const MIN_W = 240; // px
const MAX_W = 420; // px
const DEFAULT_W = 272; // px

export function AppSidebar({ className = "", style, ...props }) {
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_W;
    const saved = Number(localStorage.getItem("adminSidebarWidth"));
    return Number.isFinite(saved)
      ? Math.min(MAX_W, Math.max(MIN_W, saved))
      : DEFAULT_W;
  });

  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startW = useRef(width);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    localStorage.setItem("adminSidebarWidth", String(width));
  }, [width, isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    setResizing(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !resizing) {
      return undefined;
    }

    const onMove = (e) => {
      const touch = e.touches?.[0] || e.changedTouches?.[0];
      const clientX = (touch && touch.clientX) || e.clientX || 0;
      const delta = clientX - startX.current;
      const next = Math.min(MAX_W, Math.max(MIN_W, startW.current + delta));
      setWidth(next);
    };

    const onUp = () => setResizing(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    document.body.classList.add("select-none", "cursor-ew-resize");

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      document.body.classList.remove("select-none", "cursor-ew-resize");
    };
  }, [resizing, isMobile]);

  const beginResize = (e) => {
    if (isMobile) return;
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = (touch && touch.clientX) || e.clientX || 0;
    startX.current = clientX;
    startW.current = width;
    setResizing(true);
  };

  const wrapperStyle = isMobile ? undefined : { width: `${Math.round(width)}px` };
  const sidebarStyle = isMobile
    ? style
    : {
        ...style,
        "--sidebar-width": `${Math.round(width)}px`,
      };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    // Wrapper controls the width; Sidebar fills it.
    <div
      className={`relative z-10 shrink-0 ${isMobile ? "w-full" : ""}`.trim()}
      style={wrapperStyle}
    >
      <Sidebar
        position="sticky"
        collapsible={isMobile ? "offcanvas" : "icon"}
        className={`group/sidebar sticky left-0 top-0 flex h-svh w-full flex-col bg-[linear-gradient(180deg,var(--primary-100),var(--secondary-100))] text-slate-700 ${className}`.trim()}
        style={sidebarStyle}
        {...props}
      >
        <SidebarHeader className="flex-shrink-0 border-b border-white/40 px-4 pb-4 pt-6 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-3 group-data-[collapsible=icon]:pt-4">
          <div className="flex items-center gap-4 rounded-3xl bg-[linear-gradient(120deg,var(--primary-400),var(--primary-700))] px-4 py-4 text-white shadow-xl transition-all duration-200 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:bg-primary group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:bg-transparent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/70">
                Marvelle
              </span>
              <span className="line-clamp-1 font-serif text-xl font-semibold leading-tight">
                Admin Studio
              </span>
              <span className="line-clamp-2 text-xs text-white/80">
                Manage catalogues with confidence
              </span>
            </div>
            <Badge className="ml-auto hidden rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white group-data-[collapsible=icon]:hidden sm:flex">
              Live
            </Badge>
          </div>
        </SidebarHeader>

        {/* Independently scrollable body (scrollbar hidden) */}
        <SidebarContent className="scrollbar-hide flex-1 overflow-y-auto px-3 pb-6 pt-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pb-2 group-data-[collapsible=icon]:pt-2">
          <SidebarGroup className="space-y-3">
            <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/70 group-data-[collapsible=icon]:hidden">
              Management
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1.5">
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.href}
                      onClick={handleNavClick}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-primary/80 transition-all hover:bg-white hover:text-primary hover:shadow group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="space-y-3">
            <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/70 group-data-[collapsible=icon]:hidden">
              Tools
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1.5">
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.href}
                      onClick={handleNavClick}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-primary/80 transition-all hover:bg-white hover:text-primary hover:shadow group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="flex-shrink-0 px-3 pb-6 group-data-[collapsible=icon]:hidden">
          <div className="rounded-3xl border border-[var(--secondary-200)] bg-white/95 p-4 text-xs text-primary/80 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Storage usage</p>
              <span className="text-[11px] text-muted-foreground">67%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[var(--primary-100)]">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary via-primary-400 to-primary-200" />
            </div>
            <p className="mt-2 text-primary/70">6.7 GB of 10 GB</p>
            <a
              href="mailto:support@marvelle.com"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80"
            >
              <LifeBuoy className="h-4 w-4" />
              Contact support
            </a>
          </div>
        </SidebarFooter>

        {/* Hide the clickable rail on desktop (prevents accidental collapse while resizing) */}
        <SidebarRail className="md:hidden" />
      </Sidebar>

      {/* Drag handle (desktop only) — SINGLE hairline, overlaid to avoid double-line */}
      {!isMobile && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuemin={MIN_W}
          aria-valuemax={MAX_W}
          aria-valuenow={Math.round(width)}
          onMouseDown={beginResize}
          onTouchStart={beginResize}
          className="absolute -right-px top-0 hidden h-full w-2 cursor-ew-resize md:block z-50"
        >
          {/* ONE guide line only (removes the “double line” look) */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-black/10" />
        </div>
      )}
    </div>
  );
}
