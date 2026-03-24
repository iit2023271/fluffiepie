import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useHomepageConfig } from "@/hooks/useHomepageConfig";
import { useStoreInfo } from "@/hooks/useStoreInfo";

function Footer() {
  const { config } = useHomepageConfig();
  const { storeInfo } = useStoreInfo();
  const footer = config.footer;

  const footerSection = config.sections.find(s => s.id === "footer");
  if (footerSection && !footerSection.visible) return null;

  return (
    <footer className="bg-foreground text-background/80 mt-12 md:mt-20">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10"
        >
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1 mb-1 md:mb-0">
            <h3 className="text-base md:text-xl font-display font-bold text-background mb-1 md:mb-3">
              {storeInfo.storeName || "Store"}
            </h3>
            <p className="text-[11px] md:text-sm leading-relaxed text-background/50 max-w-xs">
              {footer.brandDescription}
            </p>
          </div>

          {/* Dynamic Link Columns */}
          {footer.columns.map((col, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.1, duration: 0.4 }}
            >
              <h4 className="font-semibold text-background text-xs md:text-sm mb-1.5 md:mb-3">{col.title}</h4>
              <div className="flex flex-col gap-1 md:gap-1.5 text-[11px] md:text-sm">
                {col.links.map((link, linkIdx) => {
                  const isExternal = link.url.startsWith("http");
                  const cls = "text-background/60 hover:text-primary transition-colors duration-200 hover:translate-x-0.5 transform inline-block";
                  return isExternal ? (
                    <a key={linkIdx} href={link.url} target="_blank" rel="noopener noreferrer" className={cls}>{link.label}</a>
                  ) : (
                    <Link key={linkIdx} to={link.url} className={cls}>{link.label}</Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="border-t border-background/10 mt-5 md:mt-10 pt-3 md:pt-5 text-center text-[10px] md:text-sm text-background/30"
        >
          {footer.copyrightText}
        </motion.div>
      </div>
    </footer>
  );
}

export default memo(Footer);