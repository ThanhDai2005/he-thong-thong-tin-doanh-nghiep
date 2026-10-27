import { ChevronLeftIcon, MailIcon, LockKeyholeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { forgotPasswordLoading, forgotPassword } = useAuthStore();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await forgotPassword(email.toLowerCase());

      if (res.email) {
        navigate("/verify-otp", { state: { email: res.email } });
      }
    } catch (error) {
      setError(error?.response?.data?.message);
      console.log(error);
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
                <LockKeyholeIcon className="w-8 h-8 text-[#b51c00]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Quên mật khẩu?
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Nhập email để nhận mã xác thực
                </CardDescription>
              </div>
            </header>

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <Label
                  className="font-medium text-sm text-gray-700"
                  htmlFor="email"
                >
                  Địa chỉ email
                </Label>
                <div className="relative">
                  <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="pl-11 h-12 rounded-xl"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <Button
                disabled={!email.trim() || forgotPasswordLoading}
                className="w-full h-12 bg-[#b51c00] hover:bg-[#8e1400] text-white rounded-xl text-base font-semibold mt-2"
                type="submit"
              >
                {forgotPasswordLoading ? "Đang gửi mã..." : "Tiếp tục"}
              </Button>
            </form>

            {/* Back to Login */}
            <Link
              to="/signin"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#b51c00] transition-colors group"
            >
              <ChevronLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Quay lại đăng nhập</span>
            </Link>
          </CardContent>
        </Card>

        {/* Info Text */}
        <p className="text-center text-xs text-gray-500 mt-6 px-4">
          Mã xác thực sẽ được gửi đến email của bạn và có hiệu lực trong 3 phút
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
