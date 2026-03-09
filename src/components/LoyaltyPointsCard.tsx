import { motion } from "framer-motion";
import { Gift, Star, TrendingUp, Clock } from "lucide-react";
import { useLoyaltyPoints } from "@/hooks/useLoyaltyPoints";
import { format } from "date-fns";

export default function LoyaltyPointsCard() {
  const { points, transactions, loading, getPointsValue } = useLoyaltyPoints();

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-12 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const redeemableValue = getPointsValue(points.balance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Gift className="w-4 h-4" />
            <span>Reward Points</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{points.balance}</span>
            <span className="text-muted-foreground">pts</span>
          </div>
          {redeemableValue > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Worth <span className="font-semibold text-primary">₹{redeemableValue}</span> on your next order
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>Lifetime</span>
          </div>
          <span className="text-lg font-semibold">{points.lifetimeEarned}</span>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-background/50 rounded-xl p-4 mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">How it works</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <span>Earn 1 point for every ₹10 spent</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <span>Redeem 10 points = ₹1 discount</span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === "earned" || tx.type === "bonus" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}>
                    {tx.type === "earned" || tx.type === "bonus" ? "+" : "-"}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(tx.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  tx.type === "earned" || tx.type === "bonus" ? "text-green-600" : "text-red-600"
                }`}>
                  {tx.type === "earned" || tx.type === "bonus" ? "+" : "-"}{Math.abs(tx.points)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
