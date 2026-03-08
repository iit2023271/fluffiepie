import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xl font-display font-bold text-background mb-4">
              Sweet<span className="text-primary">Crumbs</span>
            </h3>
            <p className="text-sm leading-relaxed text-background/60">
              Handcrafted with love. Delivering happiness, one slice at a time. Premium cakes for every occasion.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/shop" className="hover:text-primary transition-colors">Shop All</Link>
              <Link to="/shop?occasion=Birthday" className="hover:text-primary transition-colors">Birthday Cakes</Link>
              <Link to="/shop?occasion=Wedding" className="hover:text-primary transition-colors">Wedding Cakes</Link>
              <Link to="/shop?occasion=Custom" className="hover:text-primary transition-colors">Custom Orders</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-4">Support</h4>
            <div className="flex flex-col gap-2 text-sm">
              <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
              <a href="#" className="hover:text-primary transition-colors">FAQs</a>
              <a href="#" className="hover:text-primary transition-colors">Shipping Info</a>
              <a href="#" className="hover:text-primary transition-colors">Returns</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-background mb-4">Newsletter</h4>
            <p className="text-sm text-background/60 mb-3">Get fresh updates & sweet deals.</p>
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
        </div>
        <div className="border-t border-background/10 mt-12 pt-6 text-center text-sm text-background/40">
          © 2026 SweetCrumbs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
