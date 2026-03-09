import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion } from "framer-motion";

export default function NotificationToggle() {
  const { isSubscribed, isSupported, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-4 border border-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSubscribed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-medium">Push Notifications</h4>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? "You'll receive order updates" : "Get notified about your orders"}
            </p>
          </div>
        </div>

        <Button
          variant={isSubscribed ? "outline" : "default"}
          size="sm"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            "Disable"
          ) : (
            "Enable"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
