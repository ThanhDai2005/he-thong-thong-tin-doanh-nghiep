import type { Product } from "./product";

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  blogCategoryId: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  featured: boolean;
  relatedProducts?: Product[];
  status: "active" | "inactive";
  publishedAt: string | null;
  authorId: {
    _id: string;
    userId: {
      _id: string;
      displayName: string;
    };
  };
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
