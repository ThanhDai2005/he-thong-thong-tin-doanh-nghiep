import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full">
      {/* --- Footer Top (Đăng ký nhận tin) --- */}
      <div className="bg-[#f2f2f2] border-t-4 border-[#e30019] pt-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-[#e6e6e6]">
            {/* Logo */}
            <div className="lg:w-1/4 flex justify-center lg:justify-start lg:border-r border-[#ddd] pr-4">
              <img
                src="logo.webp"
                alt="Logo Đặc Sản 3 Miền"
                className="w-[120px] object-contain"
              />
            </div>

            {/* Title */}
            <div className="lg:w-1/3 text-center lg:text-left pl-0 lg:pl-6">
              <h3 className="text-2xl font-semibold uppercase mb-1 text-gray-900">
                Đăng ký nhận tin
              </h3>
              <p className="text-[#666666] text-[15px]">
                Nhận thông tin mới nhất từ chúng tôi
              </p>
            </div>

            {/* Form */}
            <div className="lg:w-5/12 w-full flex justify-center lg:justify-end">
              <form className="flex flex-col sm:flex-row w-full max-w-md items-center gap-2">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="w-full px-6 py-3 rounded-full border border-[#ccc] outline-none text-[15px] focus:border-[#e30019] transition-colors"
                />
                <button
                  type="button"
                  className="whitespace-nowrap bg-[#e30019] text-white px-8 py-3 rounded-full text-[16px] hover:bg-white hover:text-[#010f1c] hover:border-[#010f1c] border border-transparent transition-all duration-300 flex items-center justify-center gap-2 mt-3 sm:mt-0"
                >
                  ĐĂNG KÝ <i className="fa-solid fa-arrow-right"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* --- Footer Middle (Links & Info) --- */}
      <div className="bg-[#f2f2f2] py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Cột 1: Về chúng tôi */}
          <div>
            <h3 className="text-[18px] font-bold uppercase mb-7 relative pb-2 after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-[100px] after:h-[3px] after:bg-gradient-to-r after:from-[#e30019] after:to-transparent text-gray-900">
              Về chúng tôi
            </h3>
            <p className="text-[16px] text-gray-800 mb-5 leading-relaxed">
              Đặc Sản 3 Miền là thương hiệu được thành lập vào năm 2026 với tiêu
              chí đặt chất lượng sản phẩm lên hàng đầu.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[#2c2c2c] text-[#2c2c2c] flex items-center justify-center hover:bg-[#e30019] hover:text-white hover:border-[#e30019] transition-all duration-300 hover:scale-110"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[#2c2c2c] text-[#2c2c2c] flex items-center justify-center hover:bg-[#e30019] hover:text-white hover:border-[#e30019] transition-all duration-300 hover:scale-110"
              >
                <Twitter className="size-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[#2c2c2c] text-[#2c2c2c] flex items-center justify-center hover:bg-[#e30019] hover:text-white hover:border-[#e30019] transition-all duration-300 hover:scale-110"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[#2c2c2c] text-[#2c2c2c] flex items-center justify-center hover:bg-[#e30019] hover:text-white hover:border-[#e30019] transition-all duration-300 hover:scale-110"
              >
                <Youtube className="size-5" />
              </a>
            </div>
          </div>

          {/* Cột 2: Liên kết */}
          <div>
            <h3 className="text-[18px] font-bold uppercase mb-7 relative pb-2 after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-[100px] after:h-[3px] after:bg-gradient-to-r after:from-[#e30019] after:to-transparent text-gray-900">
              Liên kết
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Về chúng tôi", path: "/about" },
                { name: "Thực đơn", path: "/products" },
                { name: "Giỏ hàng", path: "/cart" },
                { name: "Đơn hàng", path: "/orders" },
                { name: "Góc ẩm thực", path: "/blogs" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className="text-[16px] text-[#2c2c2c] flex items-center group"
                  >
                    <ArrowRight className="mr-3 text-sm transition-transform duration-300 group-hover:translate-x-1" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Thực đơn */}
          <div>
            <h3 className="text-[18px] font-bold uppercase mb-7 relative pb-2 after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-[100px] after:h-[3px] after:bg-gradient-to-r after:from-[#e30019] after:to-transparent text-gray-900">
              Thực đơn
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Món lẩu", path: "/products?category=mon-lau" },
                {
                  name: "Tráng miệng",
                  path: "/products?category=mon-trang-mieng",
                },
                { name: "Món chay", path: "/products?category=mon-chay" },
                { name: "Món mặn", path: "/products?category=mon-man" },
                { name: "Nước uống", path: "/products?category=nuoc-uong" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className="text-[16px] text-[#2c2c2c] flex items-center group"
                  >
                    <ArrowRight className="mr-3 text-sm transition-transform duration-300 group-hover:translate-x-1" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="text-[18px] font-bold uppercase mb-7 relative pb-2 after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-[100px] after:h-[3px] after:bg-gradient-to-r after:from-[#e30019] after:to-transparent text-gray-900">
              Liên hệ
            </h3>
            <div className="space-y-4 text-[15px] text-gray-900">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e30019] text-white flex items-center justify-center shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p>123 Đường Trần Hưng Đạo</p>
                  <p>Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e30019] text-white flex items-center justify-center shrink-0">
                  <Phone className="size-5" />
                </div>
                <div>
                  <p>0123 456 789</p>
                  <p>0987 654 321</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e30019] text-white flex items-center justify-center shrink-0">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p>contact@dacsanbamienvn.com</p>
                  <p>www.dacsanbamienvn.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Footer Bottom (Copyright) --- */}
      <div className="bg-[#f3f5f7] py-4 border-t border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[15px] text-gray-800">
            Copyright {new Date().getFullYear()} ĐS3M. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
