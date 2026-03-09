import { Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export default function NotificationToggle() {
  const { isSubscribed, isSupported, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <BellOff className="w-5 h-5" />
        <span className="text-sm">Push notifications not supported in this browser</span>
      </div>
    );
  }

  async function handleToggle() {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) toast.success("Notifications disabled");
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Notifications enabled!");
      } else {
        toast.error("Failed to enable notifications. Please allow notifications in your browser.");
      }
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-primary" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">Get notified about order updates</p>
        </div>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
}
