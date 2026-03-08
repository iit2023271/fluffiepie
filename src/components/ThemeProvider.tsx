import { useThemeConfig } from "@/hooks/useThemeConfig";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

export default function ThemeProvider() {
  const { activeTheme } = useThemeConfig();
  const [dismissed, setDismissed] = useState(false);

  // Render festival banner if enabled
  if (!activeTheme?.bannerText || dismissed) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden relative z-50"
    >
      <div
        className="py-2.5 px-6 text-center text-sm font-medium flex items-center justify-center gap-2"
        style={{
          backgroundColor: activeTheme.bannerBg ? `hsl(${activeTheme.bannerBg})` : `hsl(var(--primary))`,
          color: activeTheme.bannerTextColor ? `hsl(${activeTheme.bannerTextColor})` : `hsl(var(--primary-foreground))`,
        }}
      >
        <span>{activeTheme.bannerText}</span>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
