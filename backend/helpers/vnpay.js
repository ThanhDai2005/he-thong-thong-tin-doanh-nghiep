import crypto from "crypto";
import qs from "qs";
import moment from "moment";
import dotenv from "dotenv";
dotenv.config();

const VNP_TMNCODE = process.env.VNP_TMNCODE;
const VNP_HASHSECRET = process.env.VNP_HASHSECRET;
const VNP_URL = process.env.VNP_URL;

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    const decodedKey = decodeURIComponent(str[key]);
    sorted[str[key]] = encodeURIComponent(obj[decodedKey]).replace(/%20/g, "+");
  }
  return sorted;
}

export const createVNPAYPayment = (order, totalAmount) => {
  const createDate = moment().format("YYYYMMDDHHmmss");

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMNCODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: `${order._id.toString()}_${Date.now()}`,
    vnp_OrderInfo: `Thanh toan don hang ${order._id.toString()}`,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(Number(totalAmount)) * 100,
    vnp_ReturnUrl: `${process.env.CLIENT_URL}/order-success/${order._id.toString()}`,
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: createDate,
  };

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", VNP_HASHSECRET);
  const signed = hmac.update(signData).digest("hex");

  sortedParams["vnp_SecureHash"] = signed;
  return `${VNP_URL}?${qs.stringify(sortedParams, { encode: false })}`;
};

export const verifyVNPAYCallback = (query) => {
  const vnp_Params = { ...query };
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", VNP_HASHSECRET);
  const signed = hmac.update(signData).digest("hex");

  return {
    isValid: secureHash === signed,
    responseCode: query["vnp_ResponseCode"],
    txnRef: query["vnp_TxnRef"],
    amount: Math.round(Number(query["vnp_Amount"]) / 100),
  };
};
