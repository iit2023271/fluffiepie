import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Palette, Gift, Star } from "lucide-react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

import heroCake from "@/assets/hero-cake.jpg";
import catBirthday from "@/assets/category-birthday.jpg";
import catWedding from "@/assets/category-wedding.jpg";
import catAnniversary from "@/assets/category-anniversary.jpg";
import catCustom from "@/assets/category-custom.jpg";

const categoryImages = [
  { name: "Birthday", slug: "Birthday", image: catBirthday },
  { name: "Wedding", slug: "Wedding", image: catWedding },
  { name: "Anniversary", slug: "Anniversary", image: catAnniversary },
  { name: "Custom", slug: "Custom", image: catCustom },
];

const steps = [
  { icon: Palette, title: "Choose & Customize", desc: "Pick your cake and personalize it" },
  { icon: Gift, title: "We Bake Fresh", desc: "Handcrafted by expert bakers" },
  { icon: Truck, title: "Delivered to You", desc: "Right on time, every time" },
];

const testimonials = [
  { name: "Priya S.", rating: 5, text: "The chocolate truffle cake was absolutely divine! Best bakery I've ordered from.", avatar: "PS" },
  { name: "Rahul M.", rating: 5, text: "Ordered a custom cake for my daughter's birthday. She was thrilled! Amazing quality.", avatar: "RM" },
  { name: "Anita K.", rating: 5, text: "Their red velvet is to die for. Fast delivery and beautifully packaged.", avatar: "AK" },
];

export default function Index() {
  const featured = products.filter((p) => p.isBestseller || p.isNew).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-1.5 bg-blush text-primary text-sm font-medium rounded-full mb-6">
                🎂 Freshly Baked, Daily
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                Cakes That Make
                <br />
                <span className="text-primary">Moments Magic</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Handcrafted premium cakes for every celebration. Order online and get it delivered fresh to your doorstep.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-card"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shop?occasion=Custom"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground rounded-xl font-medium border border-border hover:bg-secondary transition-colors"
                >
                  Custom Cake
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-elevated">
                <img src={heroCake} alt="Premium chocolate cake with berries and gold leaf" className="w-full" />
              </div>
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 md:left-4 bg-background rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[1, 2, 3].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">4.9 Rating</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">10,000+ happy customers</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Shop by Occasion</h2>
          <p className="text-muted-foreground">Find the perfect cake for your celebration</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categoryImages.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/shop?occasion=${cat.slug}`}
                className="group block relative rounded-2xl overflow-hidden aspect-[3/4]"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-lg font-display font-bold text-background">{cat.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16 bg-cream rounded-3xl mx-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">Trending Cakes</h2>
            <p className="text-muted-foreground">Our most loved creations</p>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link to="/shop" className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to your dream cake</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center p-8 rounded-2xl bg-card shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-16 h-16 rounded-2xl bg-blush flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blush py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">What Our Customers Say</h2>
            <p className="text-muted-foreground">Real reviews from real cake lovers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background rounded-2xl p-6 shadow-soft"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {t.avatar}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
