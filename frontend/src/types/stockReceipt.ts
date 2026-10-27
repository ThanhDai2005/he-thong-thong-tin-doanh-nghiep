export interface StockReceiptItem {
  productId: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    stock: number;
  };
  quantity: number;
  importPrice: number;
}

export interface StockReceipt {
  _id: string;
  supplierId: {
    _id: string;
    name: string;
    phone: string;
    email: string;
    address?: string;
    taxCode?: string;
  };
  items: StockReceiptItem[];
  totalAmount: number;
  status: "pending" | "completed" | "cancelled";
  createdBy: {
    _id: string;
    userId: {
      _id: string;
      displayName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}
