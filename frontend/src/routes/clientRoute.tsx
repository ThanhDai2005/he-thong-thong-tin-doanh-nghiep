import ClientLayout from "@/components/client/ClientLayout";
import HomePage from "@/pages/client/HomePage";
import SignUpPage from "@/pages/client/SignUpPage";
import SignInPage from "@/pages/client/SignInPage";
import PrivateRouter from "@/components/auth/PrivateRouter";
import ForgotPassword from "@/pages/client/ForgotPassword";
import VerifyOtp from "@/pages/client/VerifyOtp";
import ResetPassword from "@/pages/client/ResetPassword";
import NotFoundPage from "@/pages/client/NotFoundPage";
import ProfilePage from "@/pages/client/ProfilePage";
import ProductListPage from "@/pages/client/ProductListPage";
import ProductDetailPage from "@/pages/client/ProductDetailPage";
import CartPage from "@/pages/client/CartPage";
import CheckoutPage from "@/pages/client/CheckoutPage";
import OrdersPage from "@/pages/client/OrdersPage";
import OrderSuccessPage from "@/pages/client/OrderSuccessPage";
import OrderDetailPage from "@/pages/client/OrderDetailPage";
import OrderReviewPage from "@/pages/client/OrderReviewPage";
import OrderReviewsViewPage from "@/pages/client/OrderReviewsViewPage";
import BlogPage from "@/pages/client/BlogPage";
import BlogDetailPage from "@/pages/client/BlogDetailPage";
import AboutPage from "@/pages/client/AboutPage";
import VoucherPage from "@/pages/client/VoucherPage";
import SurveyPage from "@/pages/client/SurveyPage";
import SurveyDetailPage from "@/pages/client/SurveyDetailPage";

const clientRoute = {
  path: "/",
  children: [
    {
      path: "signup",
      element: <SignUpPage />,
    },
    {
      path: "signin",
      element: <SignInPage />,
    },
    {
      path: "forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "verify-otp",
      element: <VerifyOtp />,
    },
    {
      path: "reset-password",
      element: <ResetPassword />,
    },
    {
      element: <ClientLayout />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "products",
          element: <ProductListPage />,
        },
        {
          path: "product/:slug",
          element: <ProductDetailPage />,
        },
        {
          path: "blogs",
          element: <BlogPage />,
        },
        {
          path: "blog/:slug",
          element: <BlogDetailPage />,
        },
        {
          path: "about",
          element: <AboutPage />,
        },
        {
          path: "order-success/:orderId",
          element: <OrderSuccessPage />,
        },
        {
          element: <PrivateRouter />,
          children: [
            {
              path: "profile",
              element: <ProfilePage />,
            },
            {
              path: "vouchers",
              element: <VoucherPage />,
            },
            {
              path: "surveys",
              element: <SurveyPage />,
            },
            {
              path: "surveys/:surveyId",
              element: <SurveyDetailPage />,
            },
            {
              path: "cart",
              element: <CartPage />,
            },
            {
              path: "checkout",
              element: <CheckoutPage />,
            },
            {
              path: "orders",
              element: <OrdersPage />,
            },
            {
              path: "orders/:orderId",
              element: <OrderDetailPage />,
            },
            {
              path: "orders/:orderId/review",
              element: <OrderReviewPage />,
            },
            {
              path: "orders/:orderId/reviews",
              element: <OrderReviewsViewPage />,
            },
          ],
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ],
};

export default clientRoute;
