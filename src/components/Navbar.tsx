import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, User, Menu, X, LogOut, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Location", path: "/location" },
  { label: "Social", path: "/social" },
];

export default function Navbar() {
  const { totalItems, dispatch } = useCart();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-primary">🧁</span>
          <span className="text-xl font-display font-bold text-foreground">
            Fluffie<span className="text-primary">Pie</span>
          </span>
        </Link>

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

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Admin Panel">
                  <Shield className="w-5 h-5 text-accent" />
                </Link>
              )}
              <Link to="/dashboard" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Dashboard">
                <User className="w-5 h-5 text-primary" />
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}

          <button
            className="p-2 md:hidden rounded-full hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

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
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary transition-colors">
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-accent">
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary transition-colors text-left flex items-center gap-2 text-destructive">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg bg-primary text-primary-foreground text-center">
                  Sign In
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
