import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, Heart, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Birthday", path: "/shop?occasion=Birthday" },
  { label: "Wedding", path: "/shop?occasion=Wedding" },
];

export default function Navbar() {
  const { totalItems, dispatch } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-primary">🧁</span>
          <span className="text-xl font-display font-bold text-foreground">
            Sweet<span className="text-primary">Crumbs</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Search">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <Link to="/wishlist" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Wishlist">
            <Heart className="w-5 h-5 text-muted-foreground" />
          </Link>
          <button
            onClick={() => dispatch({ type: "TOGGLE_CART" })}
            className="p-2 rounded-full hover:bg-secondary transition-colors relative"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                {totalItems}
              </span>
            )}
          </button>
          <Link to="/account" className="p-2 rounded-full hover:bg-secondary transition-colors hidden md:flex" aria-label="Account">
            <User className="w-5 h-5 text-muted-foreground" />
          </Link>
          <button
            className="p-2 md:hidden rounded-full hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-background"
          >
            <nav className="flex flex-col p-4 gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
