import React from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { Search, ChevronLeft } from "lucide-react"

const MobileTopBar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const isHome = location.pathname === "/"

    // Helper to determine title based on path
    const getTitle = () => {
        const path = location.pathname
        if (path.startsWith("/search")) return "SHOP ALL"
        if (path.startsWith("/cart")) return "MY CART"
        if (path.startsWith("/profile")) return "PROFILE"
        if (path.startsWith("/wishlist")) return "WISHLIST"
        if (path.startsWith("/product")) return "PRODUCT DETAILS"
        return "MARVELLA"
    }

    if (isHome) {
        return (
            <div className="absolute left-0 top-0 z-50 w-full p-4 md:hidden">
                <Link to="/search" className="flex items-center gap-3 border border-white/40 bg-black/20 backdrop-blur-sm px-4 py-2.5 text-white transition-colors hover:bg-black/30">
                    <Search className="h-5 w-5 text-white" />
                    <span className="text-sm font-light text-white/90">Search "Bootcut"</span>
                </Link>
            </div>
        )
    }

    return (
        <div className="relative flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm md:hidden">
            <button
                onClick={() => navigate(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label="Go back"
            >
                <ChevronLeft className="h-6 w-6 text-black" />
            </button>

            <h1 className="text-base font-bold uppercase tracking-wider text-black">
                {getTitle()}
            </h1>

            <Link
                to="/search"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label="Search"
            >
                <Search className="h-5 w-5 text-black" />
            </Link>
        </div>
    )
}

export default MobileTopBar
