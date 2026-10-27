export interface OrderItem {
  productId: {
    _id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
  };
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  recipient: string;
  phone: string;
  address: string;
}

export interface Order {
  _id: string;
  customerId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: "COD" | "VNPAY" | "MOMO";
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  orderStatus: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  shippingFee: number;
  orderPromotionId?: string | null;
  customerVoucherId?: string | null;
  discountAmount: number;
  totalAmount: number;
  hasReviewed: boolean;
  updatedBy?: {
    _id: string;
    userId: {
      _id: string;
      displayName: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    recipient: string;
    phone: string;
    address: string;
  };
  paymentMethod: "COD" | "VNPAY" | "MOMO";
  orderPromotionId?: string;
  customerVoucherId?: string;
}
