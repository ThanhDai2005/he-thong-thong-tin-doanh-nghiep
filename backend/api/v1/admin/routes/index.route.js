import { requireAuth } from "../middlewares/auth.middleware.js";
import authRoute from "./auth.route.js";
import dashboardRoute from "./dashboard.route.js";
import userRoute from "./user.route.js";
import customerRoute from "./customer.route.js";
import staffRoute from "./staff.route.js";
import categoryRoute from "./category.route.js";
import productRoute from "./product.route.js";
import orderRoute from "./order.route.js";
import roleRoute from "./role.route.js";
import orderPromotionRoute from "./orderPromotion.route.js";
import productPromotionRoute from "./productPromotion.route.js";
import customerVoucherRoute from "./customerVoucher.route.js";
import blogRoute from "./blog.route.js";
import uploadRoute from "./upload.route.js";
import blogCategoryRoute from "./blogCategory.route.js";
import supplierRoute from "./supplier.route.js";
import stockReceiptRoute from "./stockReceipt.route.js";
import reviewRoute from "./review.route.js";
import surveyRoute from "./survey.route.js";

export const adminV1Routes = (app) => {
  const version = "/api/v1/admin";

  app.use(version + "/auth", authRoute);

  app.use(version + "/dashboard", requireAuth, dashboardRoute);

  app.use(version + "/user", requireAuth, userRoute);

  app.use(version + "/category", requireAuth, categoryRoute);

  app.use(version + "/product", requireAuth, productRoute);

  app.use(version + "/customer", requireAuth, customerRoute);

  app.use(version + "/staff", requireAuth, staffRoute);

  app.use(version + "/order", requireAuth, orderRoute);

  app.use(version + "/role", requireAuth, roleRoute);

  app.use(version + "/order-promotions", requireAuth, orderPromotionRoute);

  app.use(version + "/product-promotions", requireAuth, productPromotionRoute);

  app.use(version + "/customer-vouchers", requireAuth, customerVoucherRoute);

  app.use(version + "/blog", requireAuth, blogRoute);

  app.use(version + "/upload", requireAuth, uploadRoute);

  app.use(version + "/blog-category", requireAuth, blogCategoryRoute);

  app.use(version + "/supplier", requireAuth, supplierRoute);

  app.use(version + "/stock-receipt", requireAuth, stockReceiptRoute);

  app.use(version + "/review", requireAuth, reviewRoute);

  app.use(version + "/survey", requireAuth, surveyRoute);
};
