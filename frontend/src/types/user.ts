export interface Role {
  _id: string;
  title: string;
  description: string;
  permissions: string[];
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  displayName: string;
  phone: string;
  email: string;
  customerId?: string;
  staffId?: string;
  address?: string;
  birthday?: string;
  avatarUrl?: string;
  roleId?: Role | string | null;
  status: "active" | "inactive";
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
