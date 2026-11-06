import { GoogleGenAI } from "@google/genai";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Promotion from "../models/promotion.model.js";
import Order from "../models/order.model.js";
import logger from "../config/logger.js";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// System prompt - Train AI với context dự án
const SYSTEM_CONTEXT = `
Bạn là trợ lý ảo thân thiện của Quán Ăn Đặc Sản Ba Miền - nơi hội tụ tinh hoa ẩm thực từ Ba Miền Bắc - Trung - Nam Việt Nam.

## THÔNG TIN QUÁN ĂN
- Tên: Quán Ăn Đặc Sản Ba Miền
- Phong cách: Ẩm thực đặc sản đặc trưng từ 3 miền Bắc - Trung - Nam
- Đặc trưng: Nguyên liệu địa phương chính gốc, công thức truyền thống, hương vị đậm đà bản sắc từng vùng miền
- Giờ hoạt động: 10:00 - 22:30 hàng ngày (kể cả lễ, Tết)
- Địa chỉ: 123 Đường Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh
- Hotline: 0987 654 321
- Email: contact@dacsanbamienvn.com
- Website: www.dacsanbamienvn.com

## VAI TRÒ CỦA BẠN
1. Tư vấn thực đơn và giới thiệu món ăn phù hợp với khách hàng
2. Hỗ trợ giải đáp thắc mắc về giá cả, thành phần món ăn, khuyến mãi
3. Hướng dẫn quy trình đặt món, thanh toán, giao hàng
4. Hỗ trợ tra cứu đơn hàng và xử lý khiếu nại
5. Kết nối với nhân viên tư vấn khi cần thiết

## QUY TẮC GIAO TIẾP
✅ ĐƯỢC PHÉP:
- Nhiệt tình, thân thiện, lịch sự, nói chuyện tự nhiên như nhân viên quán đang chat
- Trả lời chính xác dựa trên dữ liệu thực đơn và khuyến mãi được cung cấp bên dưới
- Gợi ý món ăn phù hợp với nhu cầu khách (ngân sách, khẩu vị, dị ứng)
- Hướng dẫn khách đặt hàng qua website
- Kết nối nhân viên khi khách yêu cầu "Gặp nhân viên" hoặc vấn đề phức tạp

❌ KHÔNG ĐƯỢC PHÉP:
- Cung cấp thông tin sai lệch hoặc bịa đặt món ăn / combo / mã khuyến mãi không có trong dữ liệu được cung cấp
- Tiết lộ thông tin cá nhân của khách hàng khác
- Xử lý thanh toán trực tiếp (chỉ hướng dẫn)
- Cam kết về thời gian giao hàng cụ thể (chỉ nói "khoảng 30-45 phút")
- Thay đổi giá hoặc tự ý giảm giá
- Khẳng định một mã khuyến mãi chắc chắn áp dụng được cho khách (hệ thống sẽ tự kiểm tra điều kiện thực tế lúc thanh toán)

## QUY TẮC NỘI DUNG BẮT BUỘC
- Chỉ dùng món / mã KM có trong dữ liệu được cung cấp. Không bịa.
- Khi có THÔNG TIN KHÁCH HÀNG: chỉ gợi ý món tương tự nếu món đó đang có trong THỰC ĐƠN HIỆN TẠI và còn hàng.
- Ưu tiên ngắn gọn, dễ đọc trên điện thoại. Khách hỏi chung → trả lời ngắn. Khách hỏi sâu → mới giải thích thêm.
- Không viết như bài quảng cáo hay menu catalog.

## CÁC TÌNH HUỐNG THƯỜNG GẶP

### 1. Khách hỏi về món ăn / "món ngon" / "nên ăn gì"
- Chỉ gợi ý **2-3 món** (tối đa 3), ưu tiên món có tag 🔥 Hot hoặc 📈 Trending.
- Nếu có THÔNG TIN KHÁCH HÀNG: ưu tiên món tương tự lịch sử (vẫn phải có trong thực đơn và còn hàng).
- Mỗi món chỉ nêu: **tên + giá + 1 câu ngắn** vì sao đáng thử.
- Không liệt kê nguyên liệu, rating, số lượng đã bán trừ khi khách hỏi cụ thể.
- Nếu món hết hàng: xin lỗi ngắn + gợi ý 1-2 món cùng danh mục còn hàng.
- Kết thúc bằng 1 câu hỏi ngắn để tiếp tục (ví dụ: thích cay hay không cay? ăn mấy người?).

### 2. Khách muốn đặt hàng
Hướng dẫn ngắn gọn:
"Anh/chị vào mục Thực đơn trên website → chọn món → thêm vào giỏ → thanh toán và điền thông tin giao hàng là được ạ. Hoặc gọi hotline 0987 654 321 để đặt qua điện thoại."

### 3. Khách hỏi về khuyến mãi
- Chỉ trả lời dựa trên danh sách "KHUYẾN MÃI ĐANG CHẠY".
- Mã không có trong danh sách: nói rõ hiện không áp dụng / đã hết, rồi gợi ý mã đang có.
- Danh sách trống: "Hiện chưa có ưu đãi nào đang chạy, anh/chị theo dõi mục Ưu đãi trên website giúp em nhé."

### 4. Khách than phiền / khiếu nại
Xin lỗi ngắn gọn và chuyển nhân viên:
→ Gửi tín hiệu ESCALATE_TO_HUMAN

### 5. Khách hỏi về đơn hàng
"Anh/chị đăng nhập → vào mục Đơn hàng của tôi, hoặc gọi hotline 0987 654 321 để được hỗ trợ tra cứu ạ."

## TÍN HIỆU ĐẶC BIỆT
Khi cần kết nối nhân viên: phản hồi của bạn PHẢI CHỈ LÀ DUY NHẤT một object JSON hợp lệ theo đúng format dưới đây, KHÔNG thêm bất kỳ chữ nào khác trước hoặc sau JSON, KHÔNG bọc trong markdown code block:
{
  "action": "ESCALATE_TO_HUMAN",
  "reason": "Lý do (khiếu nại/yêu cầu đặc biệt/vấn đề phức tạp)",
  "message": "Tin nhắn gửi khách"
}

## PHONG CÁCH TRẢ LỜI
- Xưng hô: "em" (bot), "anh/chị" (khách).
- Độ dài: **2-4 câu ngắn**. Không viết đoạn dài, không liệt kê kiểu catalog.
- Giọng điệu: tự nhiên như đang chat Zalo với khách, thân thiện, không cứng nhắc.
- Tránh các cụm từ template như: "Dạ, đối với các món...", "em xin gợi ý đến anh/chị", "thuộc nhóm bán chạy nhất".
- Khi gợi ý món, viết ngắn gọn. Ví dụ:
  "Anh/chị có thể thử Phở Bò (50k) - nước dùng đậm, thịt mềm. Hoặc Bún chả (50k) nếu thích vị nướng thơm. Anh/chị thích nước dùng hay đồ nướng hơn ạ?"
- Không nhồi rating, số phần đã bán, nguyên liệu đầy đủ trừ khi khách hỏi rõ.
- Emoji: tối đa 1-2 cái, chỉ khi thật sự cần (🍲🍜).
- Không bắt buộc kết thúc bằng câu cố định. Có thể kết bằng câu hỏi ngắn hoặc để trống nếu đã đủ ý.
`;

// Cache đơn giản trong bộ nhớ cho context menu + khuyến mãi.
// Không cần service layer/hạ tầng cache riêng — chỉ tránh query lại DB ở MỖI tin nhắn.
let menuCache = { data: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

/**
 * Gọi hàm này ở controller admin (sau khi tạo/sửa/xoá sản phẩm, danh mục, khuyến mãi)
 * nếu muốn context AI cập nhật ngay thay vì chờ hết TTL 5 phút.
 */
export const invalidateMenuCache = () => {
  menuCache = { data: null, expiresAt: 0 };
};

/**
 * Lấy trending tag dựa trên stats từ Order aggregation
 */
const getProductTrendingTag = (productStats) => {
  const { totalSold = 0, totalOrders = 0, lastOrderDate } = productStats;

  const now = new Date();
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((now - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24))
    : 999;

  // Hot: Bán nhiều + đặt gần đây (trong 7 ngày)
  if (totalSold >= 50 && daysSinceLastOrder <= 7 && totalOrders >= 25) {
    return "🔥 Hot";
  }

  // Trending: Bán ổn + đặt gần đây (trong 14 ngày)
  if (totalSold >= 30 && daysSinceLastOrder <= 14 && totalOrders >= 15) {
    return "📈 Trending";
  }

  // Tốt: Có lượng bán ổn định
  if (totalSold >= 20 && totalOrders >= 10) {
    return "✅ Tốt";
  }

  return ""; // Không có tag
};

/**
 * Lấy stats sản phẩm từ Order aggregation (số lượng bán, số đơn, ngày đặt cuối)
 */
const getProductStats = async (productIds) => {
  try {
    const stats = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": { $in: productIds },
        },
      },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
    ]);

    const statsMap = {};
    stats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        totalSold: stat.totalSold,
        totalOrders: stat.totalOrders,
        lastOrderDate: stat.lastOrderDate,
      };
    });

    return statsMap;
  } catch (error) {
    logger.logError("Lỗi khi lấy product stats từ Order", error);
    return {};
  }
};

const formatProduct = (p, productStats = {}) => {
  const rating = (p.averageRating ?? 0).toFixed(1);
  const reviews = p.numReviews ?? 0;
  const price = (p.price ?? 0).toLocaleString("vi-VN");

  const stats = productStats[p._id.toString()] || {};
  const totalSold = stats.totalSold || 0;
  const totalOrders = stats.totalOrders || 0;
  const trendingTag = getProductTrendingTag(stats);

  let stockLine = "⚠️ HẾT HÀNG";
  if (p.stock > 0) {
    stockLine =
      p.stock < 10
        ? `Còn hàng: ${p.stock} (sắp hết, nên đặt sớm)`
        : `Còn hàng: ${p.stock}`;
  }

  // Popularity line - giúp AI biết món nào được yêu thích
  let popularityLine = "";
  if (totalOrders > 0) {
    popularityLine = `\n  📊 Độ phổ biến: ${totalSold} phần đã bán qua ${totalOrders} đơn hàng`;
    if (trendingTag) {
      popularityLine += ` | ${trendingTag}`;
    }
  }

  return `
- **${p.name}** - ${price}đ
  Mô tả: ${p.description || "Đang cập nhật"}
  Nguyên liệu: ${p.ingredients || "Đang cập nhật"}
  ${stockLine}
  Đánh giá: ${rating}/5 (${reviews} lượt)${popularityLine}`;
};

const formatPromotion = (promo) => {
  const discountText =
    promo.discountType === "percentage"
      ? `Giảm ${promo.discountValue}%${
          promo.maxDiscountAmount
            ? ` (tối đa ${promo.maxDiscountAmount.toLocaleString("vi-VN")}đ)`
            : ""
        }`
      : `Giảm ${promo.discountValue.toLocaleString("vi-VN")}đ`;

  const minOrderText =
    promo.minOrderValue > 0
      ? ` cho đơn từ ${promo.minOrderValue.toLocaleString("vi-VN")}đ`
      : "";

  return `- Mã **${promo.code}**: ${discountText}${minOrderText} — ${
    promo.description || promo.title
  }`;
};

/**
 * Lấy context thực đơn + khuyến mãi từ database để train AI (có cache 5 phút)
 */
export const getMenuContext = async () => {
  const now = Date.now();
  if (menuCache.data && menuCache.expiresAt > now) {
    return menuCache.data;
  }

  try {
    const nowDate = new Date();
    const [products, categories, promotions] = await Promise.all([
      Product.find({ deleted: false, status: "active" })
        .populate("categoryId", "name")
        .select(
          "name description ingredients price stock averageRating numReviews categoryId",
        )
        .lean(),
      Category.find({ deleted: false, status: "active" })
        .select("name slug")
        .lean(),
      Promotion.find({
        deleted: false,
        status: "active",
        startDate: { $lte: nowDate },
        endDate: { $gte: nowDate },
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
        ],
      })
        .select(
          "title code description discountType discountValue minOrderValue maxDiscountAmount",
        )
        .lean(),
    ]);

    // Lấy stats từ Order cho tất cả sản phẩm
    const productIds = products.map((p) => p._id);
    const productStats = await getProductStats(productIds);

    // Gom sản phẩm theo danh mục bằng Map — sản phẩm có categoryId lỗi/bị xoá
    // sẽ rơi vào bucket "Khác" thay vì biến mất âm thầm khỏi context.
    const categoryMap = new Map(
      categories.map((c) => [c._id.toString(), { name: c.name, products: [] }]),
    );
    const uncategorized = [];

    for (const p of products) {
      const catId = p.categoryId?._id?.toString();
      if (catId && categoryMap.has(catId)) {
        categoryMap.get(catId).products.push(p);
      } else {
        uncategorized.push(p);
      }
    }

    const allSections = [...categoryMap.values()];
    if (uncategorized.length > 0) {
      allSections.push({ name: "Khác", products: uncategorized });
    }

    const menuSection = allSections
      .filter((c) => c.products.length > 0)
      .map(
        (c) =>
          `\n### ${c.name}\n${c.products.map((p) => formatProduct(p, productStats)).join("\n")}`,
      )
      .join("\n");

    const promotionSection = promotions.length
      ? `\n## KHUYẾN MÃI ĐANG CHẠY\n${promotions
          .map(formatPromotion)
          .join(
            "\n",
          )}\n(Lưu ý: hệ thống tự kiểm tra điều kiện áp dụng - đơn tối thiểu, khách đã dùng mã chưa, còn lượt hay không - lúc khách nhập mã ở trang thanh toán. Bot chỉ giới thiệu mã, không xác nhận chắc chắn áp dụng được.)`
      : `\n## KHUYẾN MÃI ĐANG CHẠY\nHiện không có chương trình khuyến mãi nào đang áp dụng.`;

    const menuContext = `
## THỰC ĐƠN HIỆN TẠI
${menuSection}
${promotionSection}

## LƯU Ý VỀ TỒN KHO
- Món "HẾT HÀNG": Xin lỗi khách, gợi ý món tương tự CÙNG DANH MỤC đang có trong thực đơn ở trên (không tự bịa món/combo không có trong dữ liệu).
`;

    menuCache = { data: menuContext, expiresAt: now + CACHE_TTL_MS };
    return menuContext;
  } catch (error) {
    logger.logError("Lỗi khi lấy context thực đơn:", error);
    return "## THỰC ĐƠN HIỆN TẠI\n(Đang tải dữ liệu, vui lòng thử lại sau ít phút...)";
  }
};

/**
 * Lấy context cá nhân của khách hàng để AI hiểu preferences
 */
const getCustomerContext = async (customerId) => {
  if (!customerId) return "";

  try {
    // Lấy 5 đơn hàng gần nhất đã giao
    const recentOrders = await Order.find({
      customerId,
      orderStatus: "Delivered",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.productId", "name categoryId")
      .lean();

    if (recentOrders.length === 0) {
      return "\n## THÔNG TIN KHÁCH HÀNG\nKhách hàng mới, chưa có lịch sử đặt hàng.";
    }

    // Phân tích món ăn yêu thích (đếm theo quantity để chính xác hơn)
    const productFrequency = {};
    const categoryFrequency = {};
    let totalSpent = 0;

    for (const order of recentOrders) {
      totalSpent += order.totalAmount || 0;
      for (const item of order.items || []) {
        const productId = item.productId?._id?.toString();
        const productName = item.productId?.name || "Không xác định";
        const categoryId = item.productId?.categoryId?.toString();
        const qty = item.quantity || 1;

        if (productId) {
          if (!productFrequency[productId]) {
            productFrequency[productId] = { name: productName, count: 0 };
          }
          productFrequency[productId].count += qty;
        }

        if (categoryId) {
          categoryFrequency[categoryId] =
            (categoryFrequency[categoryId] || 0) + qty;
        }
      }
    }

    // Top 3 món yêu thích
    const topProducts = Object.values(productFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((p) => `${p.name} (đã đặt ${p.count} phần)`)
      .join(", ");

    // Danh mục yêu thích (null-safe)
    let topCategoryName = "Không xác định";
    const categoryIds = Object.keys(categoryFrequency);
    if (categoryIds.length > 0) {
      const topCategoryId = categoryIds.reduce((a, b) =>
        categoryFrequency[a] > categoryFrequency[b] ? a : b,
      );
      const topCategory = await Category.findById(topCategoryId)
        .select("name")
        .lean();
      if (topCategory?.name) {
        topCategoryName = topCategory.name;
      }
    }

    const avgOrderValue = Math.round(totalSpent / recentOrders.length);

    return `
## THÔNG TIN KHÁCH HÀNG
- Loại: Khách quen (đã có ${recentOrders.length} đơn giao thành công)
- Món yêu thích: ${topProducts || "Chưa có"}
- Danh mục ưa thích: ${topCategoryName}
- Giá trị đơn hàng trung bình: ${avgOrderValue.toLocaleString("vi-VN")}đ

**GỢI Ý TƯ VẤN:**
- Ưu tiên giới thiệu các món tương tự với món khách đã thích, NHƯNG chỉ chọn món đang có trong THỰC ĐƠN HIỆN TẠI và còn hàng.
- Gợi ý món trong danh mục "${topCategoryName}" nếu phù hợp.
- Nếu khách hỏi "món ngon", ưu tiên món có tag 🔥 Hot hoặc 📈 Trending trong thực đơn.
- Vẫn giữ câu trả lời ngắn gọn (2-4 câu), không liệt kê dài.
`;
  } catch (error) {
    logger.logError("Lỗi khi lấy customer context", error, { customerId });
    return "";
  }
};

/**
 * Gửi tin nhắn đến Gemini AI và nhận phản hồi (Sử dụng @google/genai SDK)
 */
export const getChatbotResponse = async (
  conversationHistory,
  userMessage,
  customerId = null,
) => {
  try {
    const menuContext = await getMenuContext();
    const customerContext = await getCustomerContext(customerId);
    const fullSystemPrompt =
      SYSTEM_CONTEXT + "\n" + menuContext + customerContext;

    // 1. Cấu trúc lại History chuẩn theo SDK @google/genai
    // Role bắt buộc là "user" hoặc "model" (không dùng "bot" hay "assistant")
    const geminiHistory = conversationHistory.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 2. Build contents array cho generateContent API
    const contents = [
      ...geminiHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    // 3. Gọi generateContent API
    // Lưu ý: KHÔNG set temperature/topP — Google đã deprecate và IGNORE 2 tham số này
    // trên dòng Gemini mới. Muốn kiểm soát độ nhất quán thì dùng system instruction rõ ràng.
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: fullSystemPrompt,
        maxOutputTokens: 2048,
      },
    });

    // 4. Lấy nội dung text từ response
    const responseText = response.text;

    // 5. Xử lý logic JSON nếu AI yêu cầu chuyển nhân viên
    if (responseText.includes("ESCALATE_TO_HUMAN")) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.action === "ESCALATE_TO_HUMAN" && parsed.message) {
            return {
              text: parsed.message,
              action: "ESCALATE_TO_HUMAN",
              reason: parsed.reason || "Không rõ lý do",
            };
          }
        } catch (e) {
          logger.logError("Lỗi parse JSON escalate từ Gemini", e, {
            responseText,
          });
        }
      }

      // Fallback AN TOÀN: model đã báo hiệu escalate nhưng JSON lỗi/không đúng format
      // → KHÔNG BAO GIỜ trả JSON thô ra cho khách, vẫn escalate để không kẹt khách lại
      return {
        text: "Em xin lỗi vì sự bất tiện này ạ. Em xin kết nối anh/chị với bộ phận chăm sóc khách hàng để hỗ trợ nhanh nhất nhé!",
        action: "ESCALATE_TO_HUMAN",
        reason: "Không xác định (lỗi parse phản hồi AI)",
      };
    }

    return {
      text: responseText,
      action: null,
    };
  } catch (error) {
    logger.logError("Lỗi khi gọi Gemini API", error, {
      model: "gemini-3.6-flash",
    });
    return {
      text: "Em xin lỗi, hệ thống đang gặp chút vấn đề. Anh/chị vui lòng thử lại sau hoặc liên hệ hotline 0987 654 321 để được hỗ trợ ngay ạ.",
      action: null,
    };
  }
};
