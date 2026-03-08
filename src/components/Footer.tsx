import { Link } from "react-router-dom";
import { useHomepageConfig } from "@/hooks/useHomepageConfig";

export default function Footer() {
  const { config } = useHomepageConfig();
  const footer = config.footer;

  // Check if footer section is visible
  const footerSection = config.sections.find(s => s.id === "footer");
  if (footerSection && !footerSection.visible) return null;

  return (
    <footer className="bg-foreground text-background/80 mt-20">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Mobile: compact 2-col grid for link columns, stacked brand & newsletter */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {/* Brand Column - full width on mobile */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-lg md:text-xl font-display font-bold text-background mb-2 md:mb-4">
              Fluffie<span className="text-primary">Pie</span>
            </h3>
            <p className="text-xs md:text-sm leading-relaxed text-background/60">
              {footer.brandDescription}
            </p>
          </div>

          {/* Dynamic Link Columns - side by side on mobile */}
          {footer.columns.map((col, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-background text-sm md:text-base mb-2 md:mb-4">{col.title}</h4>
              <div className="flex flex-col gap-1.5 md:gap-2 text-xs md:text-sm">
                {col.links.map((link, linkIdx) => {
                  const isExternal = link.url.startsWith("http");
                  return isExternal ? (
                    <a key={linkIdx} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={linkIdx} to={link.url} className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Newsletter Column - full width on mobile */}
          {footer.newsletterEnabled && (
            <div className="col-span-2 lg:col-span-1">
              <h4 className="font-semibold text-background text-sm md:text-base mb-2 md:mb-4">{footer.newsletterTitle}</h4>
              <p className="text-xs md:text-sm text-background/60 mb-2 md:mb-3">{footer.newsletterSubtitle}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-background/10 border border-background/20 text-xs md:text-sm text-background placeholder:text-background/40 focus:outline-none focus:border-primary"
                />
                <button className="px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm font-medium hover:opacity-90 transition-opacity">
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-background/10 mt-8 md:mt-12 pt-4 md:pt-6 text-center text-xs md:text-sm text-background/40">
          {footer.copyrightText}
        </div>
      </div>
    </footer>
  );
}
