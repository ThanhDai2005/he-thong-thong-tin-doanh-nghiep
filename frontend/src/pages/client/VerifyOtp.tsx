import { ChevronLeftIcon, ShieldCheckIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const { loading, forgotPasswordLoading, verifyOtp, forgotPassword } =
    useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleForgotPassword = async (email) => {
    if (cooldown > 0) return;

    toast.promise(forgotPassword(email), {
      loading: "Đang gửi lại mã OTP...",
      success: "Đã gửi lại mã OTP thành công!",
      error: (error) =>
        error?.response?.data?.message || "Gửi lại OTP thất bại!",
    });

    setCooldown(30);
  };

  // verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await verifyOtp(email, otp);

      if (res.resetToken) {
        navigate("/reset-password", {
          state: { resetToken: res.resetToken },
          replace: true,
        });
      }
    } catch (error) {
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            {/* Header with Icon */}
            <header className="text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-[#b51c00]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Xác thực email
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Mã xác nhận đã được gửi tới
                  <br />
                  <span className="font-semibold text-gray-900">{email}</span>
                </CardDescription>
              </div>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e)}
                  pattern={REGEXP_ONLY_DIGITS}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-12 h-12 text-lg border-gray-300 rounded-xl"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <Button
                disabled={otp.length !== 6 || loading}
                className="w-full h-12 bg-[#b51c00] hover:bg-[#8e1400] text-white rounded-xl text-base font-semibold"
                type="submit"
              >
                {loading ? "Đang xác thực..." : "Tiếp tục"}
              </Button>
            </form>

            {/* Resend OTP */}
            <p className="text-sm text-center text-gray-600">
              Chưa nhận được mã?{" "}
              <button
                disabled={forgotPasswordLoading || cooldown > 0}
                onClick={() => handleForgotPassword(email)}
                className="font-semibold text-[#b51c00] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0
                  ? `Gửi lại (${cooldown}s)`
                  : forgotPasswordLoading
                    ? "Đang gửi..."
                    : "Gửi lại"}
              </button>
            </p>

            {/* Back Link */}
            <Link
              to="/forgot-password"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#b51c00] transition-colors group"
            >
              <ChevronLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Quay lại</span>
            </Link>
          </CardContent>
        </Card>

        {/* Info Text */}
        <p className="text-center text-xs text-gray-500 mt-6 px-4">
          Mã OTP có hiệu lực trong 3 phút. Kiểm tra cả hộp thư spam nếu không
          thấy email.
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
