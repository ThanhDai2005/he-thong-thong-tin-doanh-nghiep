import {
  ChevronLeftIcon,
  KeyRoundIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { resetPassword, loading } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password");
    }

    window.history.replaceState({}, document.title);
  }, [resetToken]);

  if (!resetToken) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      return setError("Mật khẩu phải có ít nhất 6 ký tự");
    }

    if (confirmPassword.length < 6) {
      return setError("Mật khẩu xác nhận phải có ít nhất 6 ký tự");
    }

    if (newPassword != confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp");
    }

    try {
      const res = await resetPassword(resetToken, newPassword, confirmPassword);

      if (res.message) {
        navigate("/signin", { replace: true });
        toast.success("Đổi mật khẩu thành công");
      }
    } catch (error) {
      setError(error?.response?.data?.message);
      setTimeout(() => {
        navigate("/forgot-password", { replace: true });
      }, 2000);
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
                <KeyRoundIcon className="w-8 h-8 text-[#b51c00]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Đặt lại mật khẩu
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Nhập mật khẩu mới của bạn
                </CardDescription>
              </div>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <Label
                  className="font-medium text-sm text-gray-700"
                  htmlFor="newPassword"
                >
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <KeyRoundIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Nhập mật khẩu mới"
                    className="pl-11 pr-11 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <Label
                  className="font-medium text-sm text-gray-700"
                  htmlFor="confirmPassword"
                >
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <KeyRoundIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Nhập lại mật khẩu"
                    className="pl-11 pr-11 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <Button
                disabled={!newPassword || !confirmPassword || loading}
                className="w-full h-12 bg-[#b51c00] hover:bg-[#8e1400] text-white rounded-xl text-base font-semibold mt-2"
                type="submit"
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </form>

            {/* Back Link */}
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
          Mật khẩu phải có ít nhất 6 ký tự và nên bao gồm chữ, số và ký tự đặc
          biệt
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
