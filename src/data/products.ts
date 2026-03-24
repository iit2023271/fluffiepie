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
  originalPrice?: number | null;
  rating: number;
  reviewCount: number;
  weights: { label: string; price: number }[];
  isNew?: boolean;
  isBestseller?: boolean;
  tags?: string[];
  stockQuantity?: number;
  custom_attributes?: Record<string, string | string[]>;
}
