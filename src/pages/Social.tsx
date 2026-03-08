import { useStoreInfo } from "@/hooks/useStoreInfo";
import { ExternalLink } from "lucide-react";

const PLATFORM_META: Record<string, { icon: string; color: string }> = {
  instagram: { icon: "📸", color: "from-pink-500 to-purple-500" },
  facebook: { icon: "📘", color: "from-blue-600 to-blue-500" },
  whatsapp: { icon: "💬", color: "from-green-500 to-emerald-500" },
  youtube: { icon: "▶️", color: "from-red-600 to-red-500" },
  twitter: { icon: "🐦", color: "from-sky-500 to-blue-400" },
  x: { icon: "✖️", color: "from-gray-800 to-gray-700" },
  tiktok: { icon: "🎵", color: "from-gray-900 to-pink-500" },
  pinterest: { icon: "📌", color: "from-red-500 to-red-600" },
  linkedin: { icon: "💼", color: "from-blue-700 to-blue-600" },
  telegram: { icon: "✈️", color: "from-blue-400 to-sky-500" },
};

export default function Social() {
  const { storeInfo, loading } = useStoreInfo();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const links = storeInfo.socialLinks || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Follow Us</h1>
        <p className="text-muted-foreground">Stay connected with us on social media</p>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">No social links added yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Admin can add them in Settings → Store Info.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {links.map((link, i) => {
            const platform = link.platform.toLowerCase();
            const meta = PLATFORM_META[platform] || { icon: "🔗", color: "from-primary to-primary/80" };
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shrink-0`}>
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold capitalize">{link.platform}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
