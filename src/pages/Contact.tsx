import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import { useStoreInfo } from "@/hooks/useStoreInfo";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

export default function Contact() {
  const { storeInfo, loading } = useStoreInfo();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon 💌");
      setName("");
      setEmail("");
      setMessage("");
      setSending(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const contactCards = [
    ...(storeInfo.phone
      ? [{
          icon: Phone,
          label: "Phone",
          value: storeInfo.phone,
          secondaryValue: storeInfo.phone2 || undefined,
          href: `tel:${storeInfo.phone}`,
          color: "from-emerald-500 to-green-600",
        }]
      : []),
    ...(storeInfo.email
      ? [{
          icon: Mail,
          label: "Email",
          value: storeInfo.email,
          href: `mailto:${storeInfo.email}`,
          color: "from-blue-500 to-indigo-600",
        }]
      : []),
    ...(storeInfo.whatsappNumber
      ? [{
          icon: MessageCircle,
          label: "WhatsApp",
          value: storeInfo.whatsappNumber,
          href: `https://wa.me/${storeInfo.whatsappNumber.replace(/[^0-9]/g, "")}`,
          color: "from-green-400 to-emerald-500",
        }]
      : []),
    ...(storeInfo.address || storeInfo.city
      ? [{
          icon: MapPin,
          label: "Address",
          value: [storeInfo.address, storeInfo.city, storeInfo.state, storeInfo.pincode].filter(Boolean).join(", "),
          href: storeInfo.mapUrl || undefined,
          color: "from-rose-500 to-pink-600",
        }]
      : []),
    ...(storeInfo.openingHours
      ? [{
          icon: Clock,
          label: "Opening Hours",
          value: storeInfo.openingHours,
          color: "from-amber-500 to-orange-600",
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <Mail className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            We'd love to hear from you! Reach out to us through any of the channels below.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-2 space-y-4"
          >
            {contactCards.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Contact details coming soon!</p>
              </div>
            )}
            {contactCards.map((card, i) => {
              const Icon = card.icon;
              const Wrapper = card.href ? "a" : "div";
              const wrapperProps = card.href
                ? { href: card.href, target: card.href.startsWith("http") ? "_blank" : undefined, rel: card.href.startsWith("http") ? "noopener noreferrer" : undefined }
                : {};
              return (
                <motion.div key={i} variants={item}>
                  <Wrapper
                    {...(wrapperProps as any)}
                    className="group flex items-start gap-4 p-5 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all hover:-translate-y-1 cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <Icon className="w-5 h-5 text-background" />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
                      <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">{card.value}</p>
                      {"secondaryValue" in card && card.secondaryValue && (
                        <p className="text-sm text-muted-foreground mt-0.5">{card.secondaryValue}</p>
                      )}
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl border border-border shadow-soft p-6 md:p-8 space-y-5"
            >
              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">Send us a message</h2>
                <p className="text-sm text-muted-foreground">We'll get back to you as soon as possible!</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Your Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your cake requirements, feedback, or anything else..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <motion.button
                type="submit"
                disabled={sending}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-card disabled:opacity-60"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Map */}
        {storeInfo.mapUrl && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 rounded-2xl overflow-hidden border border-border shadow-soft"
          >
            <iframe
              src={storeInfo.mapUrl}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Store Location"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
