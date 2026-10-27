import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminRouter from "@/components/auth/AdminRouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Navigate } from "react-router";
import DashboardPage from "@/pages/admin/DashboardPage";
import ProductCategoryManagement from "@/pages/admin/ProductCategoryManagement";
import ProductCategoryCreate from "@/pages/admin/ProductCategoryCreate";
import ProductCategoryEdit from "@/pages/admin/ProductCategoryEdit";
import ProductManagement from "@/pages/admin/ProductManagement";
import ProductCreate from "@/pages/admin/ProductCreate";
import ProductEdit from "@/pages/admin/ProductEdit";
import SupplierManagement from "@/pages/admin/SupplierManagement";
import SupplierCreate from "@/pages/admin/SupplierCreate";
import SupplierEdit from "@/pages/admin/SupplierEdit";
import StockReceiptManagement from "@/pages/admin/StockReceiptManagement";
import StockReceiptCreate from "@/pages/admin/StockReceiptCreate";
import StockReceiptDetail from "@/pages/admin/StockReceiptDetail";
import BlogCategoryManagement from "@/pages/admin/BlogCategoryManagement";
import BlogCategoryCreate from "@/pages/admin/BlogCategoryCreate";
import BlogCategoryEdit from "@/pages/admin/BlogCategoryEdit";
import BlogManagement from "@/pages/admin/BlogManagement";
import BlogCreate from "@/pages/admin/BlogCreate";
import BlogEdit from "@/pages/admin/BlogEdit";
import OrderPromotionManagement from "@/pages/admin/OrderPromotionManagement";
import OrderPromotionCreate from "@/pages/admin/OrderPromotionCreate";
import OrderPromotionEdit from "@/pages/admin/OrderPromotionEdit";
import ProductPromotionManagement from "@/pages/admin/ProductPromotionManagement";
import ProductPromotionCreate from "@/pages/admin/ProductPromotionCreate";
import ProductPromotionEdit from "@/pages/admin/ProductPromotionEdit";
import CustomerVoucherManagement from "@/pages/admin/CustomerVoucherManagement";
import CustomerVoucherCreate from "@/pages/admin/CustomerVoucherCreate";
import CustomerVoucherIssue from "@/pages/admin/CustomerVoucherIssue";
import CustomerManagement from "@/pages/admin/CustomerManagement";
import CustomerCreate from "@/pages/admin/CustomerCreate";
import CustomerEdit from "@/pages/admin/CustomerEdit";
import StaffManagement from "@/pages/admin/StaffManagement";
import StaffCreate from "@/pages/admin/StaffCreate";
import StaffEdit from "@/pages/admin/StaffEdit";
import OrderManagement from "@/pages/admin/OrderManagement";
import OrderDetail from "@/pages/admin/OrderDetail";
import PermissionManagement from "@/pages/admin/PermissionManagement";
import RoleManagement from "@/pages/admin/RoleManagement";
import RoleEdit from "@/pages/admin/RoleEdit";
import RoleCreate from "@/pages/admin/RoleCreate";
import ChatManagement from "@/pages/admin/ChatManagement";
import ReviewManagement from "@/pages/admin/ReviewManagement";
import SurveyManagement from "@/pages/admin/SurveyManagement";
import SurveyCreate from "@/pages/admin/SurveyCreate";
import SurveyEdit from "@/pages/admin/SurveyEdit";
import SurveyDetail from "@/pages/admin/SurveyDetail";
import CustomerReport from "@/pages/admin/CustomerReport";

const adminRoute = {
  path: "/admin",
  children: [
    {
      index: true,
      element: <Navigate to="login" replace />,
    },
    {
      path: "login",
      element: <AdminLoginPage />,
    },
    {
      element: <AdminRouter />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            {
              path: "dashboard",
              element: <DashboardPage />,
            },
            {
              path: "product-categories",
              element: <ProductCategoryManagement />,
            },
            {
              path: "product-category/create",
              element: <ProductCategoryCreate />,
            },
            {
              path: "product-category/edit/:categoryId",
              element: <ProductCategoryEdit />,
            },
            {
              path: "products",
              element: <ProductManagement />,
            },
            {
              path: "product/create",
              element: <ProductCreate />,
            },
            {
              path: "product/edit/:productId",
              element: <ProductEdit />,
            },
            {
              path: "suppliers",
              element: <SupplierManagement />,
            },
            {
              path: "supplier/create",
              element: <SupplierCreate />,
            },
            {
              path: "supplier/edit/:supplierId",
              element: <SupplierEdit />,
            },
            {
              path: "stock-receipts",
              element: <StockReceiptManagement />,
            },
            {
              path: "stock-receipt/create",
              element: <StockReceiptCreate />,
            },
            {
              path: "stock-receipt/:receiptId",
              element: <StockReceiptDetail />,
            },
            {
              path: "blog-categories",
              element: <BlogCategoryManagement />,
            },
            {
              path: "blog-category/create",
              element: <BlogCategoryCreate />,
            },
            {
              path: "blog-category/edit/:blogCategoryId",
              element: <BlogCategoryEdit />,
            },
            {
              path: "blogs",
              element: <BlogManagement />,
            },
            {
              path: "blog/create",
              element: <BlogCreate />,
            },
            {
              path: "blog/edit/:blogId",
              element: <BlogEdit />,
            },
            {
              path: "order-promotions",
              element: <OrderPromotionManagement />,
            },
            {
              path: "order-promotion/create",
              element: <OrderPromotionCreate />,
            },
            {
              path: "order-promotion/edit/:orderPromotionId",
              element: <OrderPromotionEdit />,
            },
            {
              path: "product-promotions",
              element: <ProductPromotionManagement />,
            },
            {
              path: "product-promotion/create",
              element: <ProductPromotionCreate />,
            },
            {
              path: "product-promotion/edit/:productPromotionId",
              element: <ProductPromotionEdit />,
            },
            {
              path: "customer-vouchers",
              element: <CustomerVoucherManagement />,
            },
            {
              path: "customer-vouchers/create",
              element: <CustomerVoucherCreate />,
            },
            {
              path: "customer-vouchers/issue/:promotionId",
              element: <CustomerVoucherIssue />,
            },
            {
              path: "customers",
              element: <CustomerManagement />,
            },
            {
              path: "customer/create",
              element: <CustomerCreate />,
            },
            {
              path: "customer/edit/:customerId",
              element: <CustomerEdit />,
            },
            {
              path: "customer-reports",
              element: <CustomerReport />,
            },
            {
              path: "staffs",
              element: <StaffManagement />,
            },
            {
              path: "staff/create",
              element: <StaffCreate />,
            },
            {
              path: "staff/edit/:staffId",
              element: <StaffEdit />,
            },
            {
              path: "orders",
              element: <OrderManagement />,
            },
            {
              path: "order/:orderId",
              element: <OrderDetail />,
            },
            {
              path: "permissions",
              element: <PermissionManagement />,
            },
            {
              path: "roles",
              element: <RoleManagement />,
            },
            {
              path: "role/create",
              element: <RoleCreate />,
            },
            {
              path: "role/edit/:roleId",
              element: <RoleEdit />,
            },
            {
              path: "chats",
              element: <ChatManagement />,
            },
            {
              path: "reviews",
              element: <ReviewManagement />,
            },
            {
              path: "surveys",
              element: <SurveyManagement />,
            },
            {
              path: "survey/create",
              element: <SurveyCreate />,
            },
            {
              path: "survey/edit/:surveyId",
              element: <SurveyEdit />,
            },
            {
              path: "survey/:surveyId",
              element: <SurveyDetail />,
            },
            {
              path: "customer-report",
              element: <CustomerReport />,
            },
          ],
        },
      ],
    },
  ],
};

export default adminRoute;
