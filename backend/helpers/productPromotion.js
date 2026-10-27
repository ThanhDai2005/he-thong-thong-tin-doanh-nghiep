import ProductPromotion from "../models/productPromotion.model.js";

// Helper: tìm ProductPromotion đang active cho danh sách productIds
export const getActiveProductPromotions = async (productIds) => {
  const now = new Date();
  const productPromotions = await ProductPromotion.find({
    productIds: { $in: productIds },
  })
    .populate({
      path: "promotionId",
      match: {
        deleted: false,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    })
    .lean();

  // Build map: productId.toString() → promotion info
  const promoMap = {};
  for (const pp of productPromotions) {
    if (!pp.promotionId) continue; // populate match lọc ra null nếu không hợp lệ
    for (const pid of pp.productIds) {
      const key = pid.toString();
      if (productIds.map((id) => id.toString()).includes(key)) {
        // Chỉ ghi nếu chưa có hoặc discount cao hơn
        const existing = promoMap[key];
        const promo = pp.promotionId;
        if (!existing || promo.discountValue > existing.discountValue) {
          promoMap[key] = {
            _id: pp._id,
            promotionId: promo._id,
            title: promo.title,
            code: promo.code,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            maxDiscountAmount: promo.maxDiscountAmount,
            endDate: promo.endDate,
          };
        }
      }
    }
  }
  return promoMap;
};

// Helper: tính giá thực tế sau Flash Sale (nếu có)
export const getEffectivePrice = async (productId, originalPrice) => {
  const now = new Date();
  const productPromo = await ProductPromotion.findOne({
    productIds: productId,
  })
    .populate({
      path: "promotionId",
      match: {
        deleted: false,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    })
    .lean();

  // Không có promotion active → giá gốc
  if (!productPromo || !productPromo.promotionId) return originalPrice;

  const promo = productPromo.promotionId;
  let discount = 0;

  if (promo.discountType === "percentage") {
    discount = (originalPrice * promo.discountValue) / 100;
    if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
      discount = promo.maxDiscountAmount;
    }
  } else {
    discount = promo.discountValue;
  }

  return Math.max(0, Math.round(originalPrice - discount));
};
