import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useEffect } from "react";

const ClientLayout = () => {
  const { accessToken, isAuthChecked, checkAuth } = useAuthStore();
  const { connect } = useSocketStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthChecked && accessToken) {
      connect(accessToken);
    }
  }, [isAuthChecked, accessToken, connect]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />

      <ChatWidget />
    </div>
  );
};

export default ClientLayout;
