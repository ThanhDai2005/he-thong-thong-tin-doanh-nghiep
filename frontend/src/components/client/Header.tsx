import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { cart } = useCartStore();
  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate("/");
  };

  const handleMobileNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-4 h-18 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors active:scale-95">
                <span className="material-symbols-outlined">menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center justify-center">
                  <img
                    src="/logo.webp"
                    alt="DS3M Logo"
                    width={80}
                    height={80}
                    className="w-20 h-auto object-contain"
                  />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => handleMobileNavClick("/")}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    home
                  </span>
                  <span className="text-base font-medium">Trang chủ</span>
                </button>
                <button
                  onClick={() => handleMobileNavClick("/products")}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    restaurant
                  </span>
                  <span className="text-base font-medium">Thực đơn</span>
                </button>
                <button
                  onClick={() => handleMobileNavClick("/blogs")}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    article
                  </span>
                  <span className="text-base font-medium">Góc Ẩm Thực</span>
                </button>
                <button
                  onClick={() => handleMobileNavClick("/about")}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    info
                  </span>
                  <span className="text-base font-medium">Về Chúng Tôi</span>
                </button>
                {user && (
                  <button
                    onClick={() => handleMobileNavClick("/orders")}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      receipt_long
                    </span>
                    <span className="text-base font-medium">Đơn hàng</span>
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => handleMobileNavClick("/vouchers")}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      card_giftcard
                    </span>
                    <span className="text-base font-medium">Ưu đãi</span>
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => handleMobileNavClick("/profile")}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      person
                    </span>
                    <span className="text-base font-medium">Hồ sơ</span>
                  </button>
                )}
                <div className="border-t border-gray-200 my-4" />
                {!user ? (
                  <>
                    <button
                      onClick={() => handleMobileNavClick("/signin")}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#b51c00] hover:bg-red-50 transition-colors text-left font-medium"
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        login
                      </span>
                      <span className="text-base">Đăng nhập</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/signup")}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#b51c00] text-white hover:bg-[#8e1400] transition-colors text-left font-medium"
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        person_add
                      </span>
                      <span className="text-base">Đăng ký</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={async () => {
                      await signOut();
                      setMobileMenuOpen(false);
                      navigate("/");
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      logout
                    </span>
                    <span className="text-base">Đăng xuất</span>
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center">
            <img
              src="/logo.webp"
              alt="DS3M Logo"
              width={72}
              height={72}
              className="w-18 h-auto object-contain"
            />
          </Link>
        </div>

        {/* Web Navigation (Hidden on Mobile) */}
        <nav className="hidden md:flex gap-8">
          <Link
            to="/"
            className="text-[14px] font-medium text-gray-600 hover:opacity-80 transition-opacity"
          >
            Trang chủ
          </Link>
          <Link
            to="/products"
            className="text-[14px] font-medium text-gray-600 hover:opacity-80 transition-opacity"
          >
            Thực đơn
          </Link>
          <Link
            to="/blogs"
            className="text-[14px] font-medium text-gray-600 hover:opacity-80 transition-opacity"
          >
            Góc Ẩm Thực
          </Link>
          <Link
            to="/about"
            className="text-[14px] font-medium text-gray-600 hover:opacity-80 transition-opacity"
          >
            Về Chúng Tôi
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <form
            onSubmit={handleSearch}
            className="hidden md:flex relative w-64"
          >
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] text-sm transition-colors"
              placeholder="Tìm kiếm món ăn..."
              type="text"
            />
          </form>

          <button
            onClick={() => navigate(user ? "/cart" : "/signin")}
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-[#b51c00] hover:bg-gray-100 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-300 cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="w-full h-full bg-[#b51c00] flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        person
                      </span>
                      Hồ sơ
                    </button>
                    <button
                      onClick={() => {
                        navigate("/vouchers");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        card_giftcard
                      </span>
                      Ưu đãi
                    </button>
                    <button
                      onClick={() => {
                        navigate("/orders");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        receipt_long
                      </span>
                      Đơn hàng
                    </button>
                    <button
                      onClick={() => {
                        navigate("/surveys");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        poll
                      </span>
                      Khảo sát
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex gap-2 ml-2">
              <button
                onClick={() => navigate("/signin")}
                className="px-4 py-2 text-sm font-medium text-[#b51c00] border border-[#b51c00] rounded-lg hover:bg-red-50 transition"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 text-sm font-medium text-white bg-[#b51c00] rounded-lg hover:bg-[#8e1400] transition"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
