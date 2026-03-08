import chocolateTruffle from "@/assets/product-chocolate-truffle.jpg";
import redVelvet from "@/assets/product-red-velvet.jpg";
import butterscotch from "@/assets/product-butterscotch.jpg";
import strawberry from "@/assets/product-strawberry.jpg";
import vanilla from "@/assets/product-vanilla.jpg";
import mango from "@/assets/product-mango.jpg";
import blueberry from "@/assets/product-blueberry.jpg";
import pineapple from "@/assets/product-pineapple.jpg";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  occasion: string[];
  flavour: string;
  image: string;
  images?: string[];
  basePrice: number;
  rating: number;
  reviewCount: number;
  weights: { label: string; price: number }[];
  isNew?: boolean;
  isBestseller?: boolean;
  tags?: string[];
  custom_attributes?: Record<string, string | string[]>;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Chocolate Truffle Cake",
    slug: "chocolate-truffle-cake",
    description: "A rich, decadent chocolate truffle cake layered with velvety ganache and topped with dark chocolate shavings. Perfect for chocolate lovers.",
    category: "Chocolate",
    occasion: ["Birthday", "Anniversary"],
    flavour: "Chocolate",
    image: chocolateTruffle,
    basePrice: 599,
    rating: 4.8,
    reviewCount: 324,
    weights: [
      { label: "500g", price: 599 },
      { label: "1kg", price: 999 },
      { label: "2kg", price: 1799 },
    ],
    isBestseller: true,
  },
  {
    id: "2",
    name: "Red Velvet Dream Cake",
    slug: "red-velvet-dream-cake",
    description: "Classic red velvet cake with layers of cream cheese frosting. A timeless favourite for every celebration.",
    category: "Premium",
    occasion: ["Birthday", "Anniversary", "Wedding"],
    flavour: "Red Velvet",
    image: redVelvet,
    basePrice: 699,
    rating: 4.7,
    reviewCount: 256,
    weights: [
      { label: "500g", price: 699 },
      { label: "1kg", price: 1199 },
      { label: "2kg", price: 2099 },
    ],
    isBestseller: true,
  },
  {
    id: "3",
    name: "Butterscotch Bliss",
    slug: "butterscotch-bliss",
    description: "Smooth butterscotch cake with caramel drizzle and crunchy butterscotch chips. A crowd favourite.",
    category: "Classic",
    occasion: ["Birthday", "Custom"],
    flavour: "Butterscotch",
    image: butterscotch,
    basePrice: 549,
    rating: 4.6,
    reviewCount: 189,
    weights: [
      { label: "500g", price: 549 },
      { label: "1kg", price: 899 },
      { label: "2kg", price: 1599 },
    ],
  },
  {
    id: "4",
    name: "Strawberry Shortcake",
    slug: "strawberry-shortcake",
    description: "Light sponge cake layered with fresh strawberries and whipped cream. A refreshing delight.",
    category: "Fruit",
    occasion: ["Birthday", "Custom"],
    flavour: "Strawberry",
    image: strawberry,
    basePrice: 649,
    rating: 4.5,
    reviewCount: 167,
    weights: [
      { label: "500g", price: 649 },
      { label: "1kg", price: 1099 },
      { label: "2kg", price: 1899 },
    ],
    isNew: true,
  },
  {
    id: "5",
    name: "Vanilla Garden Cake",
    slug: "vanilla-garden-cake",
    description: "Elegant vanilla bean cake with buttercream frosting adorned with edible flowers.",
    category: "Classic",
    occasion: ["Wedding", "Anniversary"],
    flavour: "Vanilla",
    image: vanilla,
    basePrice: 499,
    rating: 4.4,
    reviewCount: 142,
    weights: [
      { label: "500g", price: 499 },
      { label: "1kg", price: 849 },
      { label: "2kg", price: 1499 },
    ],
  },
  {
    id: "6",
    name: "Mango Mousse Cake",
    slug: "mango-mousse-cake",
    description: "Tropical mango mousse cake with fresh mango slices. A summer favorite bursting with flavor.",
    category: "Fruit",
    occasion: ["Birthday", "Custom"],
    flavour: "Mango",
    image: mango,
    basePrice: 749,
    rating: 4.7,
    reviewCount: 198,
    weights: [
      { label: "500g", price: 749 },
      { label: "1kg", price: 1299 },
      { label: "2kg", price: 2299 },
    ],
    isNew: true,
  },
  {
    id: "7",
    name: "Blueberry Cheesecake",
    slug: "blueberry-cheesecake",
    description: "Creamy cheesecake with blueberry compote topping. Rich, tangy and utterly divine.",
    category: "Premium",
    occasion: ["Anniversary", "Custom"],
    flavour: "Blueberry",
    image: blueberry,
    basePrice: 799,
    rating: 4.9,
    reviewCount: 276,
    weights: [
      { label: "500g", price: 799 },
      { label: "1kg", price: 1399 },
      { label: "2kg", price: 2499 },
    ],
    isBestseller: true,
  },
  {
    id: "8",
    name: "Pineapple Upside Down",
    slug: "pineapple-upside-down",
    description: "Classic pineapple upside-down cake with caramelized pineapple rings and maraschino cherries.",
    category: "Classic",
    occasion: ["Birthday", "Custom"],
    flavour: "Pineapple",
    image: pineapple,
    basePrice: 549,
    rating: 4.3,
    reviewCount: 134,
    weights: [
      { label: "500g", price: 549 },
      { label: "1kg", price: 899 },
      { label: "2kg", price: 1599 },
    ],
  },
];

export const categories = [
  { name: "Birthday", slug: "birthday" },
  { name: "Wedding", slug: "wedding" },
  { name: "Anniversary", slug: "anniversary" },
  { name: "Custom", slug: "custom" },
];

export const flavours = ["Chocolate", "Vanilla", "Red Velvet", "Butterscotch", "Strawberry", "Mango", "Blueberry", "Pineapple"];
export const categoryTypes = ["Classic", "Premium", "Chocolate", "Fruit"];
export const occasions = ["Birthday", "Wedding", "Anniversary", "Custom"];
