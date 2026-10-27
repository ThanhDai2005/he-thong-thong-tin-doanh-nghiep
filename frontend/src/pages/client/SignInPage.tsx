import { SignInForm } from "@/components/auth/signin-form";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const SignInPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <SignInForm />
    </div>
  );
};

export default SignInPage;
