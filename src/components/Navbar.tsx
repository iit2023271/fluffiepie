import { useState, useEffect, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, User, Menu, X, LogOut, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import SearchOverlay from "@/components/SearchOverlay";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Location", path: "/location" },
  { label: "Social", path: "/social" },
  { label: "Contact", path: "/contact" },
];

function Navbar() {
  const { totalItems, dispatch } = useCart();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
          <motion.span
            whileHover={{ rotate: [0, -15, 15, 0], transition: { duration: 0.5 } }}
            className="text-2xl font-display font-bold text-primary"
          >
            🧁
          </motion.span>
          <span className="text-xl font-display font-bold text-foreground">
            Fluffie<span className="text-primary">Pie</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setSearchOpen(true)}
            className="p-2.5 rounded-full hover:bg-secondary transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => dispatch({ type: "TOGGLE_CART" })}
            className="p-2.5 rounded-full hover:bg-secondary transition-colors relative"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {user ? (
            <div className="hidden md:flex items-center gap-1">
              {isAdmin && (
                <motion.div whileTap={{ scale: 0.85 }}>
                  <Link to="/admin" className="p-2.5 rounded-full hover:bg-secondary transition-colors" aria-label="Admin Panel">
                    <Shield className="w-5 h-5 text-accent" />
                  </Link>
                </motion.div>
              )}
              <motion.div whileTap={{ scale: 0.85 }}>
                <Link to="/dashboard" className="p-2.5 rounded-full hover:bg-secondary transition-colors" aria-label="Dashboard">
                  <User className="w-5 h-5 text-primary" />
                </Link>
              </motion.div>
            </div>
          ) : (
            <motion.div whileTap={{ scale: 0.95 }} className="hidden md:block">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.85 }}
            className="p-2.5 md:hidden rounded-full hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-border overflow-hidden bg-background will-change-auto"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, ease: "easeOut" }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center text-sm font-medium py-3 px-4 rounded-xl transition-colors active:scale-[0.98] ${
                      location.pathname === link.path
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {user ? (
                <>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium py-3 px-4 rounded-xl hover:bg-secondary transition-colors active:scale-[0.98]">
                      <User className="w-4 h-4" /> My Account
                    </Link>
                  </motion.div>
                  {isAdmin && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium py-3 px-4 rounded-xl hover:bg-secondary transition-colors text-accent active:scale-[0.98]">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    </motion.div>
                  )}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 }}>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="w-full flex items-center gap-2 text-sm font-medium py-3 px-4 rounded-xl hover:bg-secondary transition-colors text-destructive active:scale-[0.98]">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-3 px-4 rounded-xl bg-primary text-primary-foreground text-center active:scale-[0.98] transition-transform mt-2">
                    Sign In
                  </Link>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
