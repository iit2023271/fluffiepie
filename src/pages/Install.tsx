import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Share, MoreVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Detect standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-display font-bold mb-3">
          Install Fluffie<span className="text-primary">Pie</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Add FluffiePie to your home screen for quick access, offline browsing, and a native app experience.
        </p>

        {installed ? (
          <div className="flex items-center justify-center gap-2 text-primary font-medium py-3">
            <Check className="w-5 h-5" />
            FluffiePie is installed!
          </div>
        ) : deferredPrompt ? (
          <Button size="lg" onClick={handleInstall} className="gap-2 text-base px-8">
            <Download className="w-5 h-5" /> Install App
          </Button>
        ) : isIOS ? (
          <div className="bg-card rounded-2xl p-6 shadow-soft text-left space-y-4">
            <h3 className="font-display font-semibold text-sm">How to install on iPhone/iPad:</h3>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">1</div>
              <p className="text-sm text-muted-foreground pt-1">
                Tap the <Share className="w-4 h-4 inline text-primary" /> <strong>Share</strong> button in Safari
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">2</div>
              <p className="text-sm text-muted-foreground pt-1">
                Scroll down and tap <strong>"Add to Home Screen"</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">3</div>
              <p className="text-sm text-muted-foreground pt-1">
                Tap <strong>"Add"</strong> — that's it! 🎉
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-soft text-left space-y-4">
            <h3 className="font-display font-semibold text-sm">How to install on Android:</h3>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">1</div>
              <p className="text-sm text-muted-foreground pt-1">
                Tap the <MoreVertical className="w-4 h-4 inline text-primary" /> <strong>menu</strong> in your browser
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">2</div>
              <p className="text-sm text-muted-foreground pt-1">
                Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: "⚡", label: "Fast & Smooth" },
            { emoji: "📴", label: "Works Offline" },
            { emoji: "🔔", label: "No App Store" },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-xl bg-secondary/50">
              <div className="text-2xl mb-1">{f.emoji}</div>
              <p className="text-xs text-muted-foreground font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
