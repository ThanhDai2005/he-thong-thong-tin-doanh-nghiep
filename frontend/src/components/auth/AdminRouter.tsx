import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const AdminRouter = () => {
  const { accessToken, user, loading, getDetail, refreshToken } =
    useAdminAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
    if (!accessToken) {
      await refreshToken();
    }

    if (accessToken && !user) {
      await getDetail();
    }

    setStarting(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (starting || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />

        <div className="text-center">
          <p className="text-lg font-semibold">Đang tải ứng dụng</p>
          <p className="text-sm text-muted-foreground">
            Vui lòng chờ trong giây lát...
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  return (
    <>
      <Outlet />
    </>
  );
};

export default AdminRouter;
