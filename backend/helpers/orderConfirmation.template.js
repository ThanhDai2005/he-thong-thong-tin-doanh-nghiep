export const orderConfirmationTemplate = (order) => {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const itemsHtml = order.items
    .map((item) => {
      const name = item.productId?.name || "Sản phẩm";
      const lineTotal = (item.price * item.quantity).toLocaleString("vi-VN");
      const unit = item.price.toLocaleString("vi-VN");
      return `<li style="margin:0 0 8px;padding:0;line-height:1.5">
        ${name} — ${item.quantity} × ${unit}₫ = <strong>${lineTotal}₫</strong>
      </li>`;
    })
    .join("");

  const paymentMethodLabels = {
    COD: "Thanh toán khi nhận hàng (COD)",
    VNPAY: "VNPAY",
    MOMO: "MoMo",
  };

  const recipient = order.shippingAddress?.recipient || "Quý khách";
  const orderCode = order._id.toString().slice(-8).toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đơn hàng #${orderCode}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222222">

  <div style="max-width:600px;margin:0 auto;padding:24px 20px">

    <p style="margin:0 0 16px">Xin chào <strong>${recipient}</strong>,</p>

    <p style="margin:0 0 20px">
      Cảm ơn bạn đã đặt hàng tại <strong>Đặc Sản Ba Miền</strong>.
      Chúng tôi đã nhận được đơn hàng của bạn. Dưới đây là thông tin chi tiết:
    </p>

    <p style="margin:0 0 8px;font-weight:bold">Thông tin đơn hàng:</p>
    <ul style="margin:0 0 20px;padding-left:20px">
      <li style="margin-bottom:4px">Mã đơn hàng: <strong>#${orderCode}</strong></li>
      <li style="margin-bottom:4px">Người nhận: ${recipient}</li>
      <li style="margin-bottom:4px">Số điện thoại: ${order.shippingAddress?.phone || "—"}</li>
      <li style="margin-bottom:4px">Địa chỉ: ${order.shippingAddress?.address || "—"}</li>
    </ul>

    <p style="margin:0 0 8px;font-weight:bold">Danh sách sản phẩm:</p>
    <ul style="margin:0 0 20px;padding-left:20px">
      ${itemsHtml}
    </ul>

    <p style="margin:0 0 8px;font-weight:bold">Thông tin thanh toán:</p>
    <ul style="margin:0 0 20px;padding-left:20px">
      <li style="margin-bottom:4px">Tạm tính: ${subtotal.toLocaleString("vi-VN")}₫</li>
      <li style="margin-bottom:4px">Phí vận chuyển: ${Number(order.shippingFee || 0).toLocaleString("vi-VN")}₫</li>
      ${
        order.discountAmount > 0
          ? `<li style="margin-bottom:4px">Giảm giá: -${Number(order.discountAmount).toLocaleString("vi-VN")}₫</li>`
          : ""
      }
      <li style="margin-bottom:4px">
        <strong>Tổng cộng: ${Number(order.totalAmount).toLocaleString("vi-VN")}₫</strong>
      </li>
      <li style="margin-bottom:4px">
        Phương thức thanh toán: ${paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
      </li>
    </ul>

    <p style="margin:0 0 20px;color:#b51c00">
      Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.
      Nếu có thắc mắc, vui lòng liên hệ hotline <strong>098.765.4321</strong>.
    </p>

    <p style="margin:0 0 4px">Cảm ơn bạn đã tin tưởng Đặc Sản Ba Miền!</p>
    <p style="margin:0 0 24px">Trân trọng,<br><strong>Đặc Sản Ba Miền</strong></p>
  </div>

</body>
</html>
  `;
};
