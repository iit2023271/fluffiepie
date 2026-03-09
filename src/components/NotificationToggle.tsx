import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationToggle() {
  const { isSubscribed, isSupported, loading, hasVapidKey, subscribe, unsubscribe } = usePushNotifications();
  const [checked, setChecked] = useState(isSubscribed);

  useEffect(() => setChecked(isSubscribed), [isSubscribed]);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <BellOff className="h-5 w-5" />
        <span className="text-sm">Push notifications aren’t available on this device/browser.</span>
      </div>
    );
  }

  const onCheckedChange = async (next: boolean) => {
    // optimistic UI so the user can toggle immediately
    setChecked(next);

    if (next) {
      if (!hasVapidKey) {
        toast.error("Notifications aren’t configured yet.");
        setChecked(false);
        return;
      }

      const ok = await subscribe();
      if (!ok) {
        toast.error("Couldn’t enable notifications—please allow them in your browser.");
        setChecked(false);
      } else {
        toast.success("Notifications enabled");
      }
      return;
    }

    const ok = await unsubscribe();
    if (!ok) {
      toast.error("Couldn’t disable notifications.");
      setChecked(true);
    } else {
      toast.success("Notifications disabled");
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {checked ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">Order status updates & delivery alerts</p>
        </div>
      </div>

      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={loading} />
    </div>
  );
}
