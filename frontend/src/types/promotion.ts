export interface Promotion {
  _id: string;
  title: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  customersUsed: string[];
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPromotion {
  _id: string;
  promotionId: Promotion;
  minOrderValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPromotion {
  _id: string;
  promotionId: Promotion;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVoucher {
  _id: string;
  promotionId: Promotion;
  customerId: string;
  isUsed: boolean;
  usedAt: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailablePromotion {
  type: "orderPromotion" | "customerVoucher";
  orderPromotionId?: string;
  voucherId?: string;
  promotion: Promotion;
  minOrderValue?: number;
}

export interface AppliedPromotion {
  type: "orderPromotion" | "customerVoucher";
  orderPromotionId?: string;
  customerVoucherId?: string;
  code: string;
  title: string;
  discountAmount: number;
}

export interface CalculateDiscountResponse {
  orderValue: number;
  discountAmount: number;
  finalAmount: number;
  appliedPromo: {
    type: "orderPromotion" | "customerVoucher";
    code: string;
    title: string;
  } | null;
}
