import axios from "axios";
import crypto from "crypto";
import logger from "../config/logger.js";
import dotenv from "dotenv";
dotenv.config();

export const createMoMoPayment = async (order, totalAmount) => {
  const partnerCode = "MOMO";
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretkey = process.env.MOMO_SECRET_KEY;
  const requestId = partnerCode + new Date().getTime();
  const orderId = `${order._id.toString()}_${Date.now()}`;
  const orderInfo = `Thanh toan don hang ${order._id.toString()}`;

  const redirectUrl = `${process.env.CLIENT_URL}/order-success/${order._id.toString()}`;
  const ipnUrl = `${process.env.SERVER_URL}/api/v1/order/momo-callback`;
  const amount = totalAmount;
  const requestType = "payWithMethod";
  const extraData = "";

  const rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;

  const signature = crypto
    .createHmac("sha256", secretkey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  });

  try {
    const momoResponse = await axios.post(
      `https://test-payment.momo.vn/v2/gateway/api/create`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      },
    );

    return momoResponse.data;
  } catch (error) {
    logger.logError("Lỗi kết nối cổng MoMo", error, {
      orderId: order?._id,
      amount: totalAmount,
    });
    return null;
  }
};
