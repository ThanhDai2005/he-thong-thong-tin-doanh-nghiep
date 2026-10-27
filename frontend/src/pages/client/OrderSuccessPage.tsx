import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useOrderStore } from "@/stores/useOrderStore";
import { toast } from "sonner";

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { getOrderDetail, currentOrder } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      if (!orderId) {
        toast.error("Không tìm thấy đơn hàng");
        navigate("/orders");
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await getOrderDetail(orderId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [orderId, getOrderDetail, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2d8a56] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Đang xác nhận thanh toán...
          </p>
        </div>
      </div>
    );
  }

  // MoMo uses resultCode, VNPAY uses vnp_ResponseCode
  const momoResultCode = searchParams.get("resultCode");
  const vnpayResponseCode = searchParams.get("vnp_ResponseCode");

  const isSuccess =
    momoResultCode === "0" ||
    vnpayResponseCode === "00" ||
    currentOrder?.paymentStatus === "Paid";

  return (
    <div className="min-h-screen bg-white flex flex-col py-8 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white py-4 text-center flex-grow flex flex-col justify-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/logo.webp"
            alt="Logo Đặc Sản Ba Miền"
            className="w-28 h-28 object-contain mx-auto"
          />
        </div>

        {isSuccess ? (
          <>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#2d8a56] mb-6 uppercase tracking-tight">
              Cảm Ơn Đã Sử Dụng Dịch Vụ!
            </h1>

            <p className="text-gray-800 text-sm tracking-wide font-medium mb-2">
              Bạn đã đặt hàng ở hệ thống chúng tôi thành công. Chúng tôi sẽ liên
              hệ để xác nhận lại trong thời gian sớm nhất.
            </p>

            <p className="text-gray-600 mb-10 text-sm">
              Nếu bạn có thắc mắc hay cần hỗ trợ. Vui lòng liên hệ hotline{" "}
              <span className="font-bold text-[#f0a500] text-base hover:underline cursor-pointer">
                078.546.8567
              </span>
            </p>

            <div>
              <button
                onClick={() => navigate(`/orders/${currentOrder._id}`)}
                className="bg-[#b51c00] hover:bg-[#8e1400] text-white font-bold text-sm px-10 py-3.5 rounded-md transition-all active:scale-95 shadow-md shadow-orange-500/20 uppercase tracking-wide"
              >
                Xem Lịch Sử Đặt Hàng
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-5xl font-extrabold text-red-600 mb-6 uppercase tracking-tight">
              Thanh Toán Thất Bại
            </h1>

            <p className="text-gray-800 text-lg font-medium mb-2">
              Đã xảy ra lỗi trong quá trình giao dịch.
            </p>

            <p className="text-gray-600 mb-8">
              Vui lòng thử lại bằng phương thức khác hoặc liên hệ bộ phận hỗ
              trợ.
            </p>

            <p className="text-gray-600 mb-10 text-sm">
              Hotline hỗ trợ kỹ thuật:{" "}
              <span className="font-bold text-[#f0a500] text-base hover:underline cursor-pointer">
                078.546.8567
              </span>
            </p>

            <div>
              <button
                onClick={() => navigate(`/orders/${currentOrder._id}`)}
                className="bg-[#b51c00] hover:bg-[#8e1400] text-white font-bold text-sm px-10 py-3.5 rounded-md transition-all active:scale-95 shadow-md uppercase tracking-wide"
              >
                Thanh Toán Lại
              </button>
            </div>
          </>
        )}

        {/* Note Warning giống ảnh (Nền vàng nhạt) */}
        <div className="mt-16 bg-[#fff9e6] border border-[#f5e6b3] rounded-lg py-4 px-6 inline-block mx-auto max-w-2xl w-full">
          <p className="text-sm text-[#b51c00] font-medium text-center">
            <strong>Lưu ý:</strong> Nếu quý khách không nhận hàng hoặc hủy đơn
            sau khi quán đã chế biến, hệ thống sẽ ghi nhận vi phạm vào tài khoản
            của quý khách.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
