import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function CartDrawer() {
  const { state, dispatch, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={() => dispatch({ type: "TOGGLE_CART" })}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 flex flex-col shadow-elevated will-change-transform"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-display font-semibold flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5 text-primary" />
                Your Cart
                {state.items.length > 0 && (
                  <motion.span
                    key={state.items.length}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold"
                  >
                    {state.items.length}
                  </motion.span>
                )}
              </motion.h2>
              <motion.button
                whileTap={{ scale: 0.85, rotate: 90 }}
                onClick={() => dispatch({ type: "TOGGLE_CART" })}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {state.items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-muted-foreground"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-5xl mb-4"
                  >
                    🛒
                  </motion.div>
                  <p className="text-lg font-display mb-2">Your cart is empty</p>
                  <p className="text-sm">Add some delicious cakes!</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {state.items.map((item, i) => (
                      <motion.div
                        key={`${item.product.id}-${item.weight}`}
                        layout
                        initial={{ opacity: 0, x: 60, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -60, scale: 0.8 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300, delay: i * 0.03 }}
                        className="flex gap-3 p-3 rounded-xl bg-secondary/50"
                      >
                        <motion.img
                          whileTap={{ scale: 0.95 }}
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.weight}</p>
                          <motion.p
                            key={item.price * item.quantity}
                            initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                            animate={{ scale: 1, color: "hsl(var(--primary))" }}
                            className="text-sm font-semibold mt-1"
                          >
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </motion.p>
                          <div className="flex items-center gap-2 mt-2">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_QUANTITY",
                                  payload: { id: item.product.id, weight: item.weight, quantity: item.quantity - 1 },
                                })
                              }
                              className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary active:bg-secondary"
                            >
                              <Minus className="w-3 h-3" />
                            </motion.button>
                            <motion.span
                              key={item.quantity}
                              initial={{ scale: 1.4 }}
                              animate={{ scale: 1 }}
                              className="text-sm font-bold w-6 text-center"
                            >
                              {item.quantity}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_QUANTITY",
                                  payload: { id: item.product.id, weight: item.weight, quantity: item.quantity + 1 },
                                })
                              }
                              className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary active:bg-secondary"
                            >
                              <Plus className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.7, rotate: -20 }}
                          onClick={() =>
                            dispatch({ type: "REMOVE_ITEM", payload: { id: item.product.id, weight: item.weight } })
                          }
                          className="self-start p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {state.items.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="border-t border-border p-4 space-y-3"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <motion.span
                    key={totalPrice}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    className="font-semibold"
                  >
                    ₹{totalPrice.toLocaleString()}
                  </motion.span>
                </div>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/checkout"
                    onClick={() => dispatch({ type: "TOGGLE_CART" })}
                    className="block w-full text-center py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-card hover:shadow-elevated"
                  >
                    Proceed to Checkout
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
