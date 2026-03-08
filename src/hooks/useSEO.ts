import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "FluffiePie";
const DEFAULT_DESC = "Craving cake? Discover fresh, handcrafted cakes for every celebration. Customize your favorite flavors and get them delivered fresh to your doorstep.";

function setMeta(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO({ title, description, image, url, type = "website", jsonLd }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Birthday Cake Delivery & Custom Cakes`;
    const desc = description || DEFAULT_DESC;
    const pageUrl = url || window.location.href;

    // Title
    document.title = fullTitle;

    // Standard meta
    setMeta("description", desc, true);

    // Open Graph
    setMeta("og:title", fullTitle);
    setMeta("og:description", desc);
    setMeta("og:type", type);
    setMeta("og:url", pageUrl);
    if (image) setMeta("og:image", image);
    setMeta("og:site_name", SITE_NAME);

    // Twitter
    setMeta("twitter:title", fullTitle, true);
    setMeta("twitter:description", desc, true);
    if (image) setMeta("twitter:image", image, true);
    setMeta("twitter:card", "summary_large_image", true);

    // JSON-LD
    let scriptEl = document.querySelector('script[data-seo-jsonld]') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.setAttribute("type", "application/ld+json");
        scriptEl.setAttribute("data-seo-jsonld", "true");
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      // Reset title on unmount
      document.title = `${SITE_NAME} – Birthday Cake Delivery & Custom Cakes`;
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, image, url, type, jsonLd]);
}
