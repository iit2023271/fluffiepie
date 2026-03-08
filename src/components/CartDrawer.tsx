import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Trash2 } from "lucide-react";
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
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={() => dispatch({ type: "TOGGLE_CART" })}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 flex flex-col shadow-elevated will-change-transform"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-display font-semibold">Your Cart</h2>
              <button
                onClick={() => dispatch({ type: "TOGGLE_CART" })}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p className="text-lg font-display mb-2">Your cart is empty</p>
                  <p className="text-sm">Add some delicious cakes!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {state.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.weight}`}
                      className="flex gap-3 p-3 rounded-xl bg-secondary/50"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.weight}</p>
                        <p className="text-sm font-semibold text-primary mt-1">₹{item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              dispatch({
                                type: "UPDATE_QUANTITY",
                                payload: { id: item.product.id, weight: item.weight, quantity: item.quantity - 1 },
                              })
                            }
                            className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() =>
                              dispatch({
                                type: "UPDATE_QUANTITY",
                                payload: { id: item.product.id, weight: item.weight, quantity: item.quantity + 1 },
                              })
                            }
                            className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          dispatch({ type: "REMOVE_ITEM", payload: { id: item.product.id, weight: item.weight } })
                        }
                        className="self-start p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {state.items.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{totalPrice.toLocaleString()}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => dispatch({ type: "TOGGLE_CART" })}
                  className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
