import { useThemeConfig } from "@/hooks/useThemeConfig";
import { AnimatePresence, motion } from "framer-motion";

export default function ThemeProvider() {
  const { activeTheme } = useThemeConfig();

  // Render festival banner if enabled
  if (!activeTheme?.bannerText) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div
          className="py-2 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: activeTheme.bannerBg ? `hsl(${activeTheme.bannerBg})` : undefined,
            color: activeTheme.bannerTextColor ? `hsl(${activeTheme.bannerTextColor})` : undefined,
          }}
        >
          {activeTheme.bannerText}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
