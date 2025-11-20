/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  Bookmark,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react"

import { AppSidebar } from "@/components/admin-dashboard/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import { useDashboardData } from "@/hooks/useDashboardData"
import { cn } from "@/lib/utils"

const defaultRequest = (url, options) => fetch(url, options)
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

const fallbackImages = [
  "https://images.unsplash.com/photo-1617039224975-4b37e99a4bd8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1508182311256-e3f9c92b88c5?auto=format&fit=crop&w=800&q=80",
]

const getProductImage = (product, index) => {
  if (product?.images?.length) {
    const candidate = product.images[0]?.url || product.images[index]?.url
    if (candidate) return candidate
  }
  return fallbackImages[index % fallbackImages.length]
}

const formatCurrency = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

const getInventoryCount = (product) => {
  if (!product?.shades?.length) return 0
  return product.shades.reduce(
    (total, shade) => total + (Number(shade?.inventory?.quantity) || 0),
    0,
  )
}

function SummaryCard({ label, value, helper, accent = "from-primary/80 to-secondary/70" }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground/70">
        <span className="uppercase tracking-wide text-xs">{label}</span>
        <MoreHorizontal className="h-4 w-4 text-primary/50" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      <div className={cn("mt-5 h-1.5 rounded-full bg-gradient-to-r", accent)} />
    </div>
  )
}

function FilterChip({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary/60 bg-primary/10 text-primary shadow-[0_10px_25px_rgba(84,46,122,0.2)]"
          : "border-[#d9d1f3] text-[#6e5b91] hover:border-primary/40 hover:text-primary",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  )
}

function ProductCard({ product, index, onEdit, variant = "grid" }) {
  const cover = getProductImage(product, index)
  const priceLabel = formatCurrency(product?.basePrice ?? product?.price)
  const rating = Number(product?.averageRating) || 0
  const reviews = Number(product?.reviewCount) || 0
  const inventory = getInventoryCount(product)
  const shades = product?.shades ?? []
  const updatedAt = product?.updatedAt ?? product?.createdAt
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Recently added"
  const variantClasses =
    variant === "list"
      ? "md:flex-row md:items-stretch"
      : "flex flex-col"

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-[26px] border border-white/80 bg-white text-[#1f1238] shadow-[0_25px_60px_rgba(43,22,81,0.16)] transition hover:-translate-y-1 hover:shadow-[0_35px_65px_rgba(35,18,66,0.25)]",
        variantClasses,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          variant === "list" ? "h-64 w-full md:w-72" : "h-48 w-full",
        )}
      >
        <img
          src={cover}
          alt={product?.name ?? "Product"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className="rounded-full bg-white/90 text-[0.65rem] font-medium text-primary">
            {product?.collection?.name ?? "Uncategorized"}
          </Badge>
          {inventory < 12 ? (
            <Badge className="rounded-full bg-[#f43f5e] text-[0.65rem] font-medium text-white">Low stock</Badge>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Save product"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/60"
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold">{product?.name ?? "Untitled product"}</p>
            <span className="text-sm text-white/70">{priceLabel}</span>
          </div>
          <p className="text-sm text-white/60 line-clamp-2">
            {product?.description || "Meet the next signature shade from your collection."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#6a588b]">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-[#b1a0cc]">({reviews})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-violet-300" />
            <span>{shades.length} shades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-sky-300" />
            <span>{inventory} units</span>
          </div>
        </div>

        <div className="text-xs font-medium uppercase tracking-wide text-[#b1a0cc]">
          Last edited • <span className="text-[#5a3a96]">{updatedLabel}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-3">
            {shades.slice(0, 4).map((shade) => (
              <span
                key={shade.id ?? shade.sku ?? shade.name}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-white/70 to-white"
                style={{ backgroundColor: shade.hexColor ?? "#c084fc" }}
              />
            ))}
            {shades.length > 4 ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-purple-100 bg-purple-100/60 text-xs font-medium text-[#5d3f86]">
                +{shades.length - 4}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            className="rounded-full bg-gradient-to-r from-[#9061f9] to-[#f472b6] px-5 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:opacity-90"
            onClick={() => onEdit?.(product)}
          >
            Edit product
          </Button>
        </div>
      </div>
    </article>
  )
}

export default function ProductOverview() {
  const { authFetch } = useAuth()
  const request = authFetch ?? defaultRequest
  const navigate = useNavigate()
  const { products, collections, stats, loading, refresh } = useDashboardData(true, request)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState("grid")

  const categoryOptions = useMemo(() => {
    const base = [{ value: "all", label: "All categories" }]
    const dynamic = Array.isArray(collections)
      ? collections.map((collection) => ({
          value: collection.id,
          label: collection.name,
        }))
      : []
    return [...base, { value: "uncategorized", label: "Uncategorized" }, ...dynamic]
  }, [collections])

  const highlightStats = useMemo(() => {
    if (!Array.isArray(products)) {
      return { newLaunches: 0, lowStock: 0, topRated: 0, avgRating: stats?.averageRating ?? 0 }
    }
    const now = Date.now()
    return products.reduce(
      (acc, product) => {
        const createdAt = product?.createdAt ? new Date(product.createdAt).getTime() : 0
        if (createdAt && now - createdAt <= THIRTY_DAYS) acc.newLaunches += 1
        if ((product?.averageRating ?? 0) >= 4.5) acc.topRated += 1
        if (getInventoryCount(product) < 12) acc.lowStock += 1
        return acc
      },
      { newLaunches: 0, lowStock: 0, topRated: 0, avgRating: stats?.averageRating ?? 0 },
    )
  }, [products, stats])

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return []
    const q = search.trim().toLowerCase()
    const now = Date.now()
    const sorted = products
      .filter((product) => {
        const name = product?.name?.toLowerCase() ?? ""
        const slug = product?.slug?.toLowerCase() ?? ""
        if (q && !name.includes(q) && !slug.includes(q)) {
          return false
        }

        if (categoryFilter === "uncategorized" && product?.collection?.id) return false
        if (
          categoryFilter !== "all" &&
          categoryFilter !== "uncategorized" &&
          product?.collection?.id !== categoryFilter
        ) {
          return false
        }

        if (priorityFilter === "low" && getInventoryCount(product) >= 12) return false
        if (priorityFilter === "top" && (product?.averageRating ?? 0) < 4.5) return false
        if (priorityFilter === "new") {
          const createdAt = product?.createdAt ? new Date(product.createdAt).getTime() : 0
          if (!createdAt || now - createdAt > THIRTY_DAYS) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "rating") {
          return (b?.averageRating ?? 0) - (a?.averageRating ?? 0)
        }
        if (sortBy === "inventory") {
          return getInventoryCount(b) - getInventoryCount(a)
        }
        return new Date(b?.createdAt ?? 0) - new Date(a?.createdAt ?? 0)
      })

    return sorted
  }, [products, search, categoryFilter, priorityFilter, sortBy])

  useEffect(() => {
    const handler = () => refresh?.()
    window.addEventListener("dashboard:data:refresh", handler)
    return () => window.removeEventListener("dashboard:data:refresh", handler)
  }, [refresh])

  const handleEdit = (product) => {
    if (product?.id) navigate(`/dashboard/products/${product.id}/edit`)
  }

  const handleCreate = () => navigate("/dashboard/products/new")

  const goToOverview = () => {
    refresh?.()
    navigate("/dashboard")
  }

  const summaryCards = [
    {
      label: "Total products",
      value: stats.productCount ?? 0,
      helper: `${highlightStats.newLaunches} launched this month`,
      accent: "from-[#a855f7] to-[#ec4899]",
    },
    {
      label: "Low stock alerts",
      value: highlightStats.lowStock,
      helper: `${stats.lowStockCount ?? 0} SKUs need restock`,
      accent: "from-[#f97316] to-[#facc15]",
    },
    {
      label: "Top rated shades",
      value: highlightStats.topRated,
      helper: `Avg rating ${Number(stats.averageRating ?? 0).toFixed(1)}`,
      accent: "from-[#22d3ee] to-[#6366f1]",
    },
    {
      label: "Collections online",
      value: stats.collectionCount ?? 0,
      helper: `${stats.shadeCount ?? 0} shade variations`,
      accent: "from-[#34d399] to-[#10b981]",
    },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-svh bg-[#f7f2ff] text-[#201335]">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-white/70 bg-gradient-to-b from-white via-[#fdf9ff] to-[#f5ecff] px-4 py-6 shadow-sm lg:px-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-[#251243]">
                  <SidebarTrigger className="rounded-full border border-[#ddcfff] bg-white p-2 text-[#6b4ea1] shadow-sm sm:hidden" />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#a08dd1]">Library</p>
                    <h1 className="text-3xl font-semibold text-[#2b1552]">Product preview</h1>
                    <p className="text-sm text-[#826cac]">Track, search and reorganize your full catalogue.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-[#e2d6ff] bg-white px-4 text-[#5f3a9d] hover:bg-[#f3ebff]"
                    onClick={goToOverview}
                  >
                    Overview
                  </Button>
                  <Button
                    className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#f43f5e] px-5 text-white shadow-lg shadow-fuchsia-500/30"
                    onClick={handleCreate}
                  >
                    New product
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#baacd8]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Global search…"
                    className="h-12 w-full rounded-full border border-[#e6dafc] bg-white/70 pl-12 pr-4 text-sm text-[#2c1654] placeholder:text-[#a797c8]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-[#e2d6ff] bg-white text-[#5f3a9d] hover:bg-[#f3ebff]"
                    onClick={() => refresh?.()}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sync data
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-[#e2d6ff] bg-white text-[#5f3a9d] hover:bg-[#f3ebff]"
                    onClick={() => setPriorityFilter("all")}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col overflow-y-auto px-4 py-6 lg:px-8">
            <div className="flex w-full flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <SummaryCard key={card.label} {...card} />
                ))}
              </div>

              <div className="rounded-[26px] border border-[#e2d7ff] bg-white/90 p-5 shadow-xl shadow-primary/5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 flex-wrap gap-3">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48 rounded-full border-[#e2d7ff] bg-white text-[#431f7d] hover:bg-[#f6f0ff]">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-[#f0e9ff] bg-white text-[#321453] shadow-lg">
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40 rounded-full border-[#e2d7ff] bg-white text-[#431f7d] hover:bg-[#f6f0ff]">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-[#f0e9ff] bg-white text-[#321453] shadow-lg">
                        <SelectItem value="recent">Newest</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                      </SelectContent>
                    </Select>

                    <FilterChip
                      icon={Activity}
                      active={priorityFilter === "low"}
                      onClick={() => setPriorityFilter(priorityFilter === "low" ? "all" : "low")}
                    >
                      Low stock
                    </FilterChip>
                    <FilterChip
                      icon={Star}
                      active={priorityFilter === "top"}
                      onClick={() => setPriorityFilter(priorityFilter === "top" ? "all" : "top")}
                    >
                      Top rated
                    </FilterChip>
                    <FilterChip
                      icon={TrendingUp}
                      active={priorityFilter === "new"}
                      onClick={() => setPriorityFilter(priorityFilter === "new" ? "all" : "new")}
                    >
                      New launches
                    </FilterChip>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-10 w-10 rounded-full border border-[#d7caef] text-[#5a3a96] hover:bg-[#efe6ff]",
                        viewMode === "grid" && "border-[#a885d7] bg-[#ece0ff]",
                      )}
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-10 w-10 rounded-full border border-[#d7caef] text-[#5a3a96] hover:bg-[#efe6ff]",
                        viewMode === "list" && "border-[#a885d7] bg-[#ece0ff]",
                      )}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-xs uppercase tracking-wide text-[#9f8dbf]">
                  Showing {filteredProducts.length} of {stats.productCount ?? 0} products
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center rounded-[26px] border border-dashed border-[#e2d7ff] bg-white/80 text-sm text-[#8270a4]">
                  Loading products…
                </div>
              ) : filteredProducts.length ? (
                <div
                  className={cn(
                    "gap-5",
                    viewMode === "grid"
                      ? "grid sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-5",
                  )}
                >
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id ?? index}
                      product={product}
                      index={index}
                      onEdit={handleEdit}
                      variant={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[#e2d7ff] bg-white/80 p-12 text-center text-[#28154a] shadow-inner shadow-white">
                  <p className="text-xl font-semibold">No products match these filters</p>
                  <p className="mt-2 text-sm text-[#8a75ad]">
                    Try a different category or reset your spotlight filters.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-full border-[#e2d6ff] text-[#5f3a9d] hover:bg-[#f3ebff]"
                      onClick={() => setPriorityFilter("all")}
                    >
                      Reset filters
                    </Button>
                    <Button
                      className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#f43f5e]"
                      onClick={handleCreate}
                    >
                      Create product
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
