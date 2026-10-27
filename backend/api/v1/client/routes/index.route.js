import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import categoryRoute from "./category.route.js";
import productRoute from "./product.route.js";
import cartRoute from "./cart.route.js";
import orderRoute from "./order.route.js";
import reviewRoute from "./review.route.js";
import promotionRoute from "./promotion.route.js";
import blogCategoryRoute from "./blogCategory.route.js";
import blogRoute from "./blog.route.js";
import surveyRoute from "./survey.route.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const clientV1Routes = (app) => {
  const version = "/api/v1";

  app.use(version + "/auth", authRoute);

  app.use(version + "/user", requireAuth, userRoute);

  app.use(version + "/category", categoryRoute);

  app.use(version + "/product", productRoute);

  app.use(version + "/cart", requireAuth, cartRoute);

  app.use(version + "/order", requireAuth, orderRoute);

  app.use(version + "/review", reviewRoute);

  app.use(version + "/promotion", requireAuth, promotionRoute);

  app.use(version + "/blog-category", blogCategoryRoute);

  app.use(version + "/blog", blogRoute);

  app.use(version + "/survey", requireAuth, surveyRoute);
};
