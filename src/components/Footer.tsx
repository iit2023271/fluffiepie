import { Link } from "react-router-dom";
import { useHomepageConfig } from "@/hooks/useHomepageConfig";

export default function Footer() {
  const { config } = useHomepageConfig();
  const footer = config.footer;

  return (
    <footer className="bg-foreground text-background/80 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <h3 className="text-xl font-display font-bold text-background mb-4">
              Sweet<span className="text-primary">Crumbs</span>
            </h3>
            <p className="text-sm leading-relaxed text-background/60">
              {footer.brandDescription}
            </p>
          </div>

          {/* Dynamic Link Columns */}
          {footer.columns.map((col, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-background mb-4">{col.title}</h4>
              <div className="flex flex-col gap-2 text-sm">
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

          {/* Newsletter Column */}
          {footer.newsletterEnabled && (
            <div>
              <h4 className="font-semibold text-background mb-4">{footer.newsletterTitle}</h4>
              <p className="text-sm text-background/60 mb-3">{footer.newsletterSubtitle}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-background/10 border border-background/20 text-sm text-background placeholder:text-background/40 focus:outline-none focus:border-primary"
                />
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-background/10 mt-12 pt-6 text-center text-sm text-background/40">
          {footer.copyrightText}
        </div>
      </div>
    </footer>
  );
}
