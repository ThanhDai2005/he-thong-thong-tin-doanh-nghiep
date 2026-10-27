import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useNavigate } from "react-router";

const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^(03|05|07|08|09)\d{8}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type loginForm = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginForm>({
    resolver: zodResolver(loginSchema),
  });

  const { login } = useAdminAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: loginForm) => {
    const { phone, password } = data;

    const res = await login(phone, password);
    if (res?.accessToken) {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className={cn("flex flex-col w-full", className)} {...props}>
      <div className="flex items-center justify-center">
        <img
          src="/logo.webp"
          alt="Logo"
          className="h-[120px] w-[120px] object-cover"
        />
      </div>

      <h2 className="text-[32px] font-bold text-white text-center mb-8">
        Đăng nhập quản trị
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Input: Tài khoản */}
        <div className="flex flex-col">
          <Input
            type="text"
            placeholder="Tài khoản"
            className="h-12 px-6 rounded-full bg-black/20 border-transparent text-white placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:ring-offset-0 focus-visible:border-white/50 text-[15px]"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-2 px-5">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Input: Mật khẩu */}
        <div className="flex flex-col">
          <Input
            type="password"
            placeholder="Mật khẩu"
            className="h-12 px-6 rounded-full bg-black/20 border-transparent text-white placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:ring-offset-0 focus-visible:border-white/50 text-[15px]"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-2 px-5">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Checkbox: Ghi nhớ tài khoản */}
        <div className="flex items-center gap-3 px-3 mt-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center justify-center w-[18px] h-[18px] border border-white/60 rounded-[4px] bg-transparent group-hover:bg-white/10 transition-colors">
              <input type="checkbox" className="peer sr-only" />
              <span className="material-symbols-outlined text-[14px] text-white opacity-0 peer-checked:opacity-100 transition-opacity font-bold">
                check
              </span>
            </div>
            <span className="text-[14px] text-white/90 select-none">
              Ghi nhớ tài khoản
            </span>
          </label>
        </div>

        {/* Button: Đăng nhập */}
        <div className="flex justify-center mt-6">
          <Button
            disabled={isSubmitting}
            type="submit"
            className="h-11 px-12 rounded-full bg-transparent border border-white/40 hover:bg-white/10 hover:border-white/60 text-white font-medium transition-all active:scale-95 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:ring-offset-0"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </div>
      </form>
    </div>
  );
}
