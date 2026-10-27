export interface CartItem {
  productId: {
    _id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    stock: number;
  };
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
