import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useStoreInfo } from "@/hooks/useStoreInfo";
import { motion } from "framer-motion";

export default function Location() {
  const { storeInfo, loading } = useStoreInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const hasAddress = storeInfo.address || storeInfo.city;
  const hasContact = storeInfo.phone || storeInfo.email;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Our Location</h1>
          <p className="text-muted-foreground mb-8">Visit us or get in touch — we'd love to hear from you!</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Location Card */}
            {hasAddress && (
              <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Address</h2>
                </div>
                <p className="text-foreground leading-relaxed">
                  {storeInfo.address}
                  {storeInfo.city && <><br />{storeInfo.city}</>}
                  {storeInfo.state && <>, {storeInfo.state}</>}
                  {storeInfo.pincode && <> - {storeInfo.pincode}</>}
                </p>
              </div>
            )}

            {/* Contact Card */}
            {hasContact && (
              <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Contact</h2>
                </div>
                <div className="space-y-3">
                  {storeInfo.phone && (
                    <a href={`tel:${storeInfo.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {storeInfo.phone}
                    </a>
                  )}
                  {storeInfo.phone2 && (
                    <a href={`tel:${storeInfo.phone2}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {storeInfo.phone2}
                    </a>
                  )}
                  {storeInfo.email && (
                    <a href={`mailto:${storeInfo.email}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" /> {storeInfo.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Hours Card */}
            {storeInfo.openingHours && (
              <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Opening Hours</h2>
                </div>
                <p className="text-foreground whitespace-pre-line">{storeInfo.openingHours}</p>
              </div>
            )}
          </div>

          {/* Map Embed */}
          {storeInfo.mapUrl && (
            <div className="mt-8 rounded-2xl overflow-hidden border border-border shadow-soft">
              <iframe
                src={storeInfo.mapUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
              />
            </div>
          )}

          {!hasAddress && !hasContact && (
            <div className="text-center py-16 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg">Location details coming soon!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
