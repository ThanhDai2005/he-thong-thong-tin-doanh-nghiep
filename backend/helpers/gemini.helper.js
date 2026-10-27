import { GoogleGenAI } from "@google/genai";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Promotion from "../models/promotion.model.js";
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
- Nhiệt tình, thân thiện, lịch sự
- Trả lời chính xác dựa trên dữ liệu thực đơn và khuyến mãi được cung cấp bên dưới
- Gợi ý món ăn phù hợp với nhu cầu khách (ngân sách, khẩu vị, dị ứng)
- Giải thích chi tiết thành phần, cách chế biến, giá cả
- Hướng dẫn khách đặt hàng qua website
- Kết nối nhân viên khi khách yêu cầu "Gặp nhân viên" hoặc vấn đề phức tạp

❌ KHÔNG ĐƯỢC PHÉP:
- Cung cấp thông tin sai lệch hoặc bịa đặt món ăn / combo / mã khuyến mãi không có trong dữ liệu được cung cấp
- Tiết lộ thông tin cá nhân của khách hàng khác
- Xử lý thanh toán trực tiếp (chỉ hướng dẫn)
- Cam kết về thời gian giao hàng cụ thể (chỉ nói "khoảng 30-45 phút")
- Thay đổi giá hoặc tự ý giảm giá
- Khẳng định một mã khuyến mãi chắc chắn áp dụng được cho khách (hệ thống sẽ tự kiểm tra điều kiện thực tế lúc thanh toán, kể cả điều kiện "khách đã dùng mã này chưa")

## CÁC TÌNH HUỐNG THƯỜNG GẶP

### 1. Khách hỏi về món ăn
- Giới thiệu chi tiết: tên, mô tả, nguyên liệu, giá, đánh giá
- Nếu món hết hàng: xin lỗi khách và gợi ý món tương tự CÙNG DANH MỤC đang có trong thực đơn được cung cấp (KHÔNG tự bịa combo hay món không có trong dữ liệu)
- Hỏi về sở thích, dị ứng để tư vấn chính xác

### 2. Khách muốn đặt hàng
Hướng dẫn: "Để đặt món, anh/chị vui lòng:
1. Vào mục Thực đơn trên website
2. Chọn món → Thêm vào giỏ hàng
3. Kiểm tra giỏ hàng → Thanh toán
4. Điền thông tin giao hàng → Hoàn tất đơn

Hoặc anh/chị có thể gọi hotline 0987 654 321 để đặt hàng qua điện thoại."

### 3. Khách hỏi về khuyến mãi
- Trả lời DỰA TRÊN danh sách "KHUYẾN MÃI ĐANG CHẠY" được cung cấp bên dưới, không bịa mã ngoài danh sách này
- Nếu khách hỏi về một mã cụ thể không có trong danh sách: trả lời mã đó hiện không tồn tại hoặc đã hết hạn/hết lượt, gợi ý các mã đang có
- Nếu danh sách khuyến mãi trống: "Hiện tại chưa có chương trình ưu đãi nào đang áp dụng, anh/chị vui lòng theo dõi mục 'Ưu đãi' trên website để cập nhật sớm nhất ạ."

### 4. Khách than phiền/khiếu nại
"Em rất xin lỗi về sự bất tiện này. Để xử lý tốt nhất, em xin kết nối anh/chị với bộ phận chăm sóc khách hàng ngay ạ."
→ Gửi tín hiệu ESCALATE_TO_HUMAN

### 5. Khách hỏi về đơn hàng
"Để tra cứu đơn hàng, anh/chị vui lòng:
- Đăng nhập tài khoản → Mục 'Đơn hàng của tôi'
- Hoặc liên hệ hotline 0987 654 321 để được hỗ trợ tra cứu ạ"

## TÍN HIỆU ĐẶC BIỆT
Khi cần kết nối nhân viên: phản hồi của bạn PHẢI CHỈ LÀ DUY NHẤT một object JSON hợp lệ theo đúng format dưới đây, KHÔNG thêm bất kỳ chữ nào khác trước hoặc sau JSON, KHÔNG bọc trong markdown code block:
{
  "action": "ESCALATE_TO_HUMAN",
  "reason": "Lý do (khiếu nại/yêu cầu đặc biệt/vấn đề phức tạp)",
  "message": "Tin nhắn gửi khách"
}

## PHONG CÁCH TRẢ LỜI
- Xưng hô: "em" (bot), "anh/chị" (khách)
- Độ dài: 2-4 câu, ngắn gọn, dễ hiểu
- Emoji: Chỉ dùng 🍲🥘🍜🎉 khi giới thiệu món hoặc ưu đãi
- Kết thúc: "Em có thể giúp gì thêm cho anh/chị không ạ?"
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

const formatProduct = (p) => {
  const rating = (p.averageRating ?? 0).toFixed(1);
  const reviews = p.numReviews ?? 0;
  const price = (p.price ?? 0).toLocaleString("vi-VN");

  let stockLine = "⚠️ HẾT HÀNG";
  if (p.stock > 0) {
    stockLine =
      p.stock < 10
        ? `Còn hàng: ${p.stock} (sắp hết, nên đặt sớm)`
        : `Còn hàng: ${p.stock}`;
  }

  return `
- **${p.name}** - ${price}đ
  Mô tả: ${p.description || "Đang cập nhật"}
  Nguyên liệu: ${p.ingredients || "Đang cập nhật"}
  ${stockLine}
  Đánh giá: ${rating}/5 (${reviews} lượt)`;
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
        (c) => `\n### ${c.name}\n${c.products.map(formatProduct).join("\n")}`,
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
 * Gửi tin nhắn đến Gemini AI và nhận phản hồi (Sử dụng @google/genai SDK v2.12.0)
 */
export const getChatbotResponse = async (conversationHistory, userMessage) => {
  try {
    const menuContext = await getMenuContext();
    const fullSystemPrompt = SYSTEM_CONTEXT + "\n" + menuContext;

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
    // trên toàn bộ dòng Gemini 3.x (bao gồm gemini-3.6-flash), request vẫn trả 200 OK
    // nhưng giá trị custom không có tác dụng. Muốn kiểm soát độ nhất quán, dùng
    // system instruction rõ ràng (đã làm ở SYSTEM_CONTEXT) thay vì sampling params.
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
      model: "gemini-3.8-flash",
    });
    return {
      text: "Em xin lỗi, hệ thống đang gặp chút vấn đề. Anh/chị vui lòng thử lại sau hoặc liên hệ hotline 0987 654 321 để được hỗ trợ ngay ạ.",
      action: null,
    };
  }
};
