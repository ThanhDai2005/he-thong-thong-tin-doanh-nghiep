import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "Tên bắt buộc phải có"),
    lastName: z.string().min(1, "Họ bắt buộc phải có"),
    phone: z
      .string()
      .regex(/^(03|05|07|08|09)\d{8}$/, "Số điện thoại không hợp lệ"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Xác nhận mật khẩu bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type signUpForm = z.infer<typeof signUpSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<signUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: signUpForm) => {
    const { firstName, lastName, phone, email, password } = data;
    const res = await signUp(firstName, lastName, phone, email, password);

    if (res?.message) {
      navigate("/signin");
    }
  };

  return (
    <div className={cn("w-full max-w-md", className)} {...props}>
      <Card className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
        <CardContent className="p-6 md:p-8 flex flex-col gap-6">
          {/* Header */}
          <header className="text-center flex flex-col items-center gap-2">
            <img
              className="w-28 h-auto object-contain"
              src="/logo.webp"
              alt="Logo Đặc Sản Ba Miền"
            />
            <p className="text-xl font-semibold text-gray-900">
              Tạo tài khoản mới
            </p>
            <p className="text-gray-600 mt-1 text-sm">
              Hãy tham gia cùng chúng tôi để đặt món ngon mỗi ngày!
            </p>
          </header>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  className="font-medium text-sm text-gray-700"
                  htmlFor="lastName"
                >
                  Họ
                </Label>
                <Input
                  type="text"
                  id="lastName"
                  placeholder="Nguyễn"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  className="font-medium text-sm text-gray-700"
                  htmlFor="firstName"
                >
                  Tên
                </Label>
                <Input
                  type="text"
                  id="firstName"
                  placeholder="Đại"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label
                className="font-medium text-sm text-gray-700"
                htmlFor="phone"
              >
                Số điện thoại
              </Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  phone
                </span>
                <Input
                  type="tel"
                  id="phone"
                  placeholder="0909123456"
                  className="pl-11 h-12 rounded-xl"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                className="font-medium text-sm text-gray-700"
                htmlFor="email"
              >
                Email
              </Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  mail
                </span>
                <Input
                  type="email"
                  id="email"
                  placeholder="me@gmail.com"
                  className="pl-11 h-12 rounded-xl"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                className="font-medium text-sm text-gray-700"
                htmlFor="password"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  lock
                </span>
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Nhập mật khẩu"
                  className="pl-11 pr-11 h-12 rounded-xl"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                className="font-medium text-sm text-gray-700"
                htmlFor="confirmPassword"
              >
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  lock
                </span>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  className="pl-11 pr-11 h-12 rounded-xl"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              disabled={isSubmitting}
              className="w-full h-12 bg-[#b51c00] hover:bg-[#8e1400] text-white rounded-xl text-base font-semibold mt-2"
              type="submit"
            >
              {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </form>

          {/* Link to SignIn */}
          <p className="text-center text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              to="/signin"
              className="text-[#b51c00] font-semibold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Policy */}
      <p className="text-center text-xs text-gray-500 mt-6 px-4">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link to="#" className="underline hover:text-gray-700">
          Điều khoản dịch vụ
        </Link>{" "}
        và{" "}
        <Link to="#" className="underline hover:text-gray-700">
          Chính sách bảo mật
        </Link>{" "}
        của chúng tôi.
      </p>
    </div>
  );
}
