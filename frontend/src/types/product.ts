export interface ActivePromotion {
  _id: string;
  promotionId: string;
  title: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount: number | null;
  endDate: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  price: number;
  images: string[];
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  stock: number;
  averageRating: number;
  numReviews: number;
  status: string;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activePromotion?: ActivePromotion | null;
}
