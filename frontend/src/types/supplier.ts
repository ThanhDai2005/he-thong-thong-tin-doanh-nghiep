export interface Supplier {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxCode?: string;
  status: "active" | "inactive";
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: string;
  updatedAt: string;
}
