import { SignupForm } from "@/components/auth/signup-form";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const SignUpPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <SignupForm />
    </div>
  );
};

export default SignUpPage;
