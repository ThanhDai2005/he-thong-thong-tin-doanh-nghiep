export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null;
  status: string;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
