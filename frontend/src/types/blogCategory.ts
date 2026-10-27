export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
