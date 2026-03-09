import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface LoyaltyPoints {
  balance: number;
  lifetimeEarned: number;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: "earned" | "redeemed" | "expired" | "bonus";
  description: string | null;
  orderId: string | null;
  createdAt: string;
}

export function useLoyaltyPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<LoyaltyPoints>({ balance: 0, lifetimeEarned: 0 });
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const [pointsRes, transRes] = await Promise.all([
      supabase.from("loyalty_points").select("balance, lifetime_earned").eq("user_id", user.id).maybeSingle(),
      supabase.from("loyalty_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    if (pointsRes.data) {
      setPoints({ balance: pointsRes.data.balance, lifetimeEarned: pointsRes.data.lifetime_earned });
    }

    if (transRes.data) {
      setTransactions(
        transRes.data.map((t: any) => ({
          id: t.id,
          points: t.points,
          type: t.type,
          description: t.description,
          orderId: t.order_id,
          createdAt: t.created_at,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const redeemPoints = async (pointsToRedeem: number): Promise<number> => {
    if (!user) return 0;
    if (pointsToRedeem > points.balance) {
      toast.error("Not enough points");
      return 0;
    }

    // Each 10 points = ₹1 discount
    const discount = Math.floor(pointsToRedeem / 10);

    // Update via edge function or directly (using admin policy won't work from client)
    // For now, we'll handle redemption at checkout time
    return discount;
  };

  const getPointsValue = (pts: number) => Math.floor(pts / 10); // ₹1 per 10 points

  return { points, transactions, loading, reload: load, redeemPoints, getPointsValue };
}
