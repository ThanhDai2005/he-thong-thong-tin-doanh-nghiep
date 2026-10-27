export interface Review {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
    slug: string;
    price?: number;
  } | null;
  customerId: {
    _id: string;
    userId: {
      _id: string;
      displayName: string;
      email: string;
      phone: string;
      avatarUrl?: string;
    };
    address?: string;
  } | null;
  orderId: {
    _id: string;
    createdAt: string;
    totalAmount?: number;
    status?: string;
  } | null;
  rating: number;
  comment: string;
  images?: string[];
  adminReply?: {
    content: string;
    repliedAt: string | null;
    repliedBy: {
      _id: string;
      roleId: {
        _id: string;
        title: string;
      };
      userId: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
      };
    } | null;
  };
  isHidden: boolean;
  hiddenAt?: string | null;
  hiddenBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  total: number;
  hidden: number;
  replied: number;
  visible: number;
  avgRating: number;
  ratingDistribution: Array<{
    _id: number;
    count: number;
  }>;
}
