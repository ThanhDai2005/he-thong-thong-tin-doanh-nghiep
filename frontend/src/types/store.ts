import type { Role, User } from "./user";
import type { Category } from "./category";
import type { Product } from "./product";
import type { Cart } from "./cart";
import type { CreateOrderData, Order } from "./order";
import type {
  AppliedPromotion,
  AvailablePromotion,
  CalculateDiscountResponse,
  CustomerVoucher,
  OrderPromotion,
  ProductPromotion,
  Promotion,
} from "./promotion";
import type { Review, ReviewStats } from "./review";
import type { BlogCategory } from "./blogCategory";
import type { Blog } from "./blog";
import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Supplier } from "./supplier";
import type { StockReceipt, StockReceiptItem } from "./stockReceipt";
import type { Survey } from "./survey";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  isAuthChecked: boolean;
  forgotPasswordLoading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  googleSignIn: (credential: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  getDetail: () => Promise<void>;
  refresh: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<void>;
}

export interface UserState {
  loading: boolean;

  uploadAvatar: (formData: FormData) => Promise<void>;
  updateInfo: (
    displayName: string,
    email: string,
    phone: string,
    address: string,
    birthday?: string,
  ) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ) => Promise<void>;
}

export interface CategoryState {
  category: Category[];
  loading: boolean;

  getList: () => Promise<void>;
}

export interface ProductState {
  product: Product[];
  currentProduct: Product | null;
  loading: boolean;
  totalPages: number;
  totalItems: number;

  getList: (
    keyword: string,
    categorySlug: string,
    page: number,
    limit: number,
    sortKey: string,
    sortValue: string,
    minPrice: string,
    maxPrice: string,
    hasPromotion: string,
  ) => Promise<{ totalPages: number; totalItems: number }>;
  getDetail: (slug: string) => Promise<void>;
}

export interface BlogCategoryState {
  blogCategory: BlogCategory[];
  loading: boolean;

  fetchBlogCategories: () => Promise<void>;
}

export interface BlogState {
  blog: Blog[];
  currentBlog: Blog | null;
  loading: boolean;

  getList: (
    keyword?: string,
    blogCategorySlug?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (slug: string) => Promise<void>;
}

export interface CartState {
  cart: Cart | null;
  loading: boolean;

  getCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => void;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  orderReviews: {
    order: Order | null;
    reviews: Review[];
  } | null;
  loading: boolean;
  totalPages: number;

  createOrder: (
    data: CreateOrderData,
  ) => Promise<Order & { paymentUrl?: string }>;
  getMyOrders: (
    page?: number,
    limit?: number,
    orderStatus?: string,
  ) => Promise<void>;
  getOrderDetail: (orderId: string) => Promise<void>;
  getOrderReviews: (orderId: string) => Promise<void>;
  retryPayment: (orderId: string) => Promise<{ paymentUrl?: string }>;
  cancelOrder: (orderId: string) => Promise<{ message: string; data: Order }>;
  clearCurrentOrder: () => void;
}

export interface CollectibleVoucher {
  promotion: Promotion;
  isCollected: boolean;
}

export interface PromotionState {
  availablePromotions: {
    orderPromotions: AvailablePromotion[];
    customerVouchers: AvailablePromotion[];
  } | null;
  collectibleVouchers: CollectibleVoucher[];
  appliedPromotion: AppliedPromotion | null;
  discountResult: CalculateDiscountResponse | null;
  loading: boolean;
  collectLoading: boolean;
  getAvailablePromotions: () => Promise<void>;
  getCollectibleVouchers: () => Promise<void>;
  collectVoucher: (promotionId: string) => Promise<void>;
  applyPromotion: (code: string, orderValue: number) => Promise<void>;
  applyPromotionById: (
    selectedPromo: AvailablePromotion,
    orderValue: number,
  ) => Promise<void>;
  calculateDiscount: (
    orderValue: number,
    orderPromotionId?: string,
    customerVoucherId?: string,
  ) => Promise<CalculateDiscountResponse>;
  clearPromotion: () => void;
}

export interface ReviewState {
  reviews: Review[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  createReview: (
    productId: string,
    orderId: string,
    rating: number,
    comment: string,
    images?: File[],
  ) => Promise<void>;
  getReviewsByProduct: (
    productId: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  loadMoreReviews: (productId: string, limit?: number) => Promise<void>;
  resetReviews: () => void;
}

export interface ChatState {
  messages: Message[];
  conversationId: string | null;
  conversationStatus: string | null;
  isLoading: boolean;
  isTyping: boolean;
  typingUser: "bot" | "staff" | null;
  unreadCount: number;
  isWidgetOpen: boolean;

  loadHistory: () => void;
  sendMessage: (message: string) => void;
  requestHuman: () => void;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean, user: "bot" | "staff" | null) => void;
  setConversationStatus: (
    status: "bot" | "waiting_human" | "human_active" | "closed",
  ) => void;
  setUnreadCount: (count: number) => void;
  setWidgetOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (
    token?: string,
    guestInfo?: { name: string; phone: string },
  ) => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler?: (data: any) => void) => void;
}

export interface AdminAuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  clearState: () => void;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getDetail: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface AdminDashboardState {
  stats: {
    overview: {
      totalCustomers: number;
      totalProducts: number;
      totalOrders: number;
      totalCategories: number;
    };
    orderStatus: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    revenueByDateRange: {
      totalRevenue: number;
      totalOrders: number;
    };
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
    }>;
    recentOrders: Array<{
      _id: string;
      customerId?: {
        userId?: {
          displayName: string;
        };
      };
      customerName?: string;
      totalAmount: number;
      orderStatus: string;
      createdAt: string;
    }>;
    topProducts: Array<{
      name: string;
      sold: number;
      revenue: number;
    }>;
  };
  loading: boolean;

  fetchStats: (startDate?: string, endDate?: string) => Promise<void>;
  fetchOrderStatusByMonth: (month?: string) => Promise<void>;
}

export interface AdminCategoryState {
  categories: Category[];
  totalPages: number;
  loading: boolean;

  fetchCategories: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getCategoryDetail: (categoryId: string) => Promise<Category>;
  createCategory: (data: { name: string; status?: string }) => Promise<void>;
  updateCategory: (
    categoryId: string,
    data: { name?: string; status?: string },
  ) => Promise<void>;
  changeStatus: (
    categoryId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (categoryId: string) => Promise<void>;
}

export interface AdminProductState {
  products: Product[];
  totalPages: number;
  loading: boolean;

  fetchProducts: (
    keyword?: string,
    categorySlug?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getProductDetail: (productId: string) => Promise<Product>;
  createProduct: (data: {
    name: string;
    description: string;
    ingredients: string;
    category: string;
    price: number;
    images?: string[];
    stock?: number;
    status?: string;
  }) => Promise<void>;
  updateProduct: (
    productId: string,
    data: {
      name?: string;
      description?: string;
      ingredients?: string;
      category?: string;
      price?: number;
      images?: string[];
      stock?: number;
      status?: string;
    },
  ) => Promise<void>;
  changeStatus: (
    productId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (productId: string) => Promise<void>;
}

export interface AdminBlogCategoryState {
  blogCategories: BlogCategory[];
  totalPages: number;
  loading: boolean;

  fetchBlogCategories: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getBlogCategoryDetail: (blogCategoryId: string) => Promise<BlogCategory>;
  createBlogCategory: (data: {
    name: string;
    status?: string;
  }) => Promise<void>;
  updateBlogCategory: (
    blogCategoryId: string,
    data: { name?: string; status?: string },
  ) => Promise<void>;
  changeStatus: (
    blogCategoryId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (blogCategoryId: string) => Promise<void>;
}

export interface AdminBlogState {
  blogs: Blog[];
  totalPages: number;
  loading: boolean;

  fetchBlogs: (
    keyword?: string,
    blogCategorySlug?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getBlogDetail: (blogId: string) => Promise<Blog>;
  createBlog: (data: {
    title: string;
    content: string;
    imageUrl: string;
    blogCategory?: string;
    featured?: boolean;
    relatedProducts?: string[];
    status?: string;
  }) => Promise<void>;
  updateBlog: (
    blogId: string,
    data: {
      title?: string;
      content?: string;
      imageUrl?: string;
      blogCategory?: string;
      featured?: boolean;
      relatedProducts?: string[];
      status?: string;
    },
  ) => Promise<void>;
  changeStatus: (
    blogId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (blogId: string) => Promise<void>;
}

export interface AdminPromotionStore {
  promotions: Promotion[];
  currentPromotion: Promotion | null;
  loading: boolean;
  totalPages: number;

  fetchPromotions: (
    keyword: string,
    status: string,
    page: number,
    limit: number,
  ) => Promise<void>;
  getDetail: (promotionId: string) => Promise<void>;
  createPromotion: (data: {
    title: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
  }) => Promise<void>;
  updatePromotion: (
    promotionId: string,
    data: {
      title?: string;
      code?: string;
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      maxDiscountAmount?: number | null;
      usageLimit?: number | null;
      startDate?: string;
      endDate?: string;
      status?: "active" | "inactive";
    },
  ) => Promise<void>;
  changeStatus: (
    promotionId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (promotionId: string) => Promise<void>;
}

export interface AdminOrderPromotionStore {
  orderPromotions: OrderPromotion[];
  currentOrderPromotion: OrderPromotion | null;
  loading: boolean;
  totalPages: number;

  fetchOrderPromotions: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (orderPromotionId: string) => Promise<void>;
  create: (data: {
    title: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
    minOrderValue: number;
  }) => Promise<void>;
  update: (
    orderPromotionId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  changeStatus: (
    orderPromotionId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (orderPromotionId: string) => Promise<void>;
}

export interface AdminProductPromotionStore {
  productPromotions: ProductPromotion[];
  currentProductPromotion: ProductPromotion | null;
  loading: boolean;
  totalPages: number;

  fetchProductPromotions: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (productPromotionId: string) => Promise<void>;
  create: (data: {
    title: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
    productIds: string[];
  }) => Promise<void>;
  update: (
    productPromotionId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  changeStatus: (
    productPromotionId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (productPromotionId: string) => Promise<void>;
}

export interface AdminCustomerVoucherStore {
  customerVouchers: CustomerVoucher[];
  currentCustomerVoucher: {
    promotionId: Promotion;
    totalIssued: number;
    totalUsed: number;
  } | null;
  loading: boolean;
  totalPages: number;

  fetchCustomerVouchers: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (promotionId: string) => Promise<void>;
  create: (data: {
    title: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
    customerIds: string[];
  }) => Promise<void>;
  issueVoucher: (promotionId: string, customerIds: string[]) => Promise<void>;
}

export interface AdminStaffStore {
  staffs: User[];
  currentStaff: User | null;
  loading: boolean;
  totalPages: number;

  fetchStaffs: (
    keyword?: string,
    roleId?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (staffId: string) => Promise<void>;
  createStaff: (data: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    roleId: string;
    status?: string;
  }) => Promise<void>;
  updateStaff: (
    staffId: string,
    data: {
      displayName?: string;
      email?: string;
      phone?: string;
      password?: string;
      roleId?: string;
      status?: string;
    },
  ) => Promise<void>;
  changeStatus: (staffId: string, status: string) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (staffId: string) => Promise<void>;
}

export interface AdminCustomerStore {
  customers: User[];
  currentCustomer: User | null;
  report: {
    summary: {
      totalCustomers: number;
      activeCount: number;
      inactiveCount: number;
      newCustomersLast30Days: number;
      totalOrders: number;
      totalRevenue: number;
    };
    ageDistribution: Record<string, number>;
    monthlyRegistrations: Record<string, number>;
    topProducts: Array<{
      productId: string;
      name: string;
      thumbnail: string;
      category: string;
      orderCount: number;
      totalQuantity: number;
    }>;
  } | null;
  loading: boolean;
  totalPages: number;

  fetchCustomers: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (customerId: string) => Promise<void>;
  createCustomer: (data: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    status?: string;
    address?: string;
  }) => Promise<void>;
  updateCustomer: (
    customerId: string,
    data: {
      displayName?: string;
      email?: string;
      phone?: string;
      password?: string;
      status?: string;
      address?: string;
    },
  ) => Promise<void>;
  changeStatus: (customerId: string, status: string) => Promise<void>;
  changeMulti: (
    type: "active" | "inactive" | "delete-all",
    ids: string[],
  ) => Promise<void>;
  deleteItem: (customerId: string) => Promise<void>;
  fetchReport: () => Promise<any>;
}

export interface RoleStore {
  roles: Role[];
  loading: boolean;

  fetchRoles: () => Promise<void>;
}

export interface AdminOrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  totalPages: number;
  totalItems: number;

  fetchOrders: (
    page?: number,
    limit?: number,
    filters?: {
      orderStatus?: string;
      paymentStatus?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    data: {
      orderStatus?: string;
      paymentStatus?: string;
    },
  ) => Promise<Order>;
  clearCurrentOrder: () => void;
}

export interface AdminRoleStore {
  roles: Role[];
  currentRole: Role | null;
  permissions: Array<{ group: string; value: string; label: string }>;
  loading: boolean;
  totalPages: number;

  fetchRoles: (
    keyword?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getRoleDetail: (roleId: string) => Promise<void>;
  createRole: (data: { title: string; description?: string }) => Promise<void>;
  updateRole: (
    roleId: string,
    data: { title?: string; description?: string },
  ) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  updatePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  clearCurrentRole: () => void;
}

export interface AdminChatState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  conversationLoading: boolean;
  messageLoading: boolean;
  isTyping: boolean;
  typingUser: "client" | "bot" | null;

  loadConversations: () => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, message: string) => void;
  closeConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  addNewConversation: (conversation: Conversation) => void;
  updateConversationStatus: (
    conversationId: string,
    status: "bot" | "waiting_human" | "human_active" | "closed",
  ) => void;
  updateConversationPreview: (
    conversationId: string,
    lastMessage: {
      messageId?: string;
      content: string;
      senderType: "client" | "bot" | "staff";
      createdAt: string;
    } | null,
    status: "bot" | "waiting_human" | "human_active" | "closed",
    unreadByAdmin: number,
  ) => void;
  setTyping: (isTyping: boolean, user: "client" | "bot" | null) => void;
}

export interface AdminSocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler?: (data: any) => void) => void;
}

export interface AdminSupplierState {
  suppliers: Supplier[];
  currentSupplier: Supplier | null;
  totalPages: number;
  totalItems: number;
  loading: boolean;

  fetchSuppliers: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getSupplierDetail: (supplierId: string) => Promise<Supplier>;
  createSupplier: (data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    taxCode?: string;
    status?: string;
  }) => Promise<void>;
  updateSupplier: (
    supplierId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      taxCode?: string;
      status?: string;
    },
  ) => Promise<void>;
  changeStatus: (
    supplierId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (supplierId: string) => Promise<void>;
}

export interface AdminStockReceiptState {
  receipts: StockReceipt[];
  currentReceipt: StockReceipt | null;
  totalPages: number;
  totalItems: number;
  loading: boolean;

  fetchReceipts: (
    keyword?: string,
    status?: string,
    supplierId?: string,
    startDate?: string,
    endDate?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getReceiptDetail: (receiptId: string) => Promise<StockReceipt>;
  createReceipt: (data: {
    supplierId: string;
    items: StockReceiptItem[];
  }) => Promise<StockReceipt>;
  confirmReceipt: (receiptId: string) => Promise<void>;
  cancelReceipt: (receiptId: string) => Promise<void>;
  clearCurrentReceipt: () => void;
}

export interface AdminSurveyState {
  surveys: Survey[];
  currentSurvey: Survey | null;
  totalPages: number;
  loading: boolean;

  fetchSurveys: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getSurveyDetail: (surveyId: string) => Promise<void>;
  createSurvey: (data: {
    title: string;
    description?: string;
    questions: Array<{
      questionText: string;
      type: "single_choice" | "text";
      options?: string[];
    }>;
    status?: "active" | "inactive";
  }) => Promise<void>;
  changeStatus: (
    surveyId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  getResponses: (
    surveyId: string,
    page?: number,
    limit?: number,
  ) => Promise<any>;
  getStatistics: (surveyId: string) => Promise<any>;
  clearCurrentSurvey: () => void;
}

export interface SurveyState {
  surveys: Array<{
    _id: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
  currentSurvey: Survey | null;
  totalPages: number;
  loading: boolean;

  fetchSurveys: (page?: number, limit?: number) => Promise<void>;
  getSurveyDetail: (surveyId: string) => Promise<void>;
  submitSurvey: (
    surveyId: string,
    answers: Array<{
      questionId: string;
      selectedOption?: string;
      textAnswer?: string;
    }>,
  ) => Promise<void>;
  getMyResponses: () => Promise<any>;
  clearCurrentSurvey: () => void;
}

export interface AdminReviewStore {
  reviews: Review[];
  currentReview: Review | null;
  totalPages: number;
  totalItems: number;
  loading: boolean;
  stats: ReviewStats | null;

  fetchStats: () => Promise<void>;
  fetchReviews: (
    keyword?: string,
    rating?: string,
    visibility?: string,
    page?: number,
    limit?: number,
    sortKey?: string,
    sortValue?: string,
  ) => Promise<void>;
  getReviewDetail: (reviewId: string) => Promise<void>;
  replyReview: (reviewId: string, content: string) => Promise<void>;
  deleteReply: (reviewId: string) => Promise<void>;
  toggleHidden: (reviewId: string) => Promise<void>;
  clearCurrentReview: () => void;
}
