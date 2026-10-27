import { Link } from "react-router";

const AboutPage = () => {
  return (
    <>
      <div className="min-h-screen bg-white pb-20">
        {/* ================= HERO BANNER ================= */}
        <div className="relative h-[520px] md:h-[580px] bg-[url('/banner.webp')] bg-cover bg-center bg-no-repeat overflow-hidden flex items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

          <div className="relative max-w-7xl mx-auto px-4 md:px-6 text-center z-10">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-sm font-bold tracking-[2px] text-white mb-6">
                CÂU CHUYỆN CỦA CHÚNG TÔI
              </span>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tighter leading-[1.05] drop-shadow-2xl mb-6">
                Về <span className="text-[#ffd700]">DacSan3M</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
                Hành trình kết nối những tâm hồn đam mê ẩm thực với hàng ngàn
                hương vị đặc sản ba miền, mang trọn niềm vui đến tận cửa nhà.
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* ================= STORY SECTION ================= */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-1 relative group">
              <div className="absolute inset-0 bg-[#b51c00] rounded-3xl translate-x-4 translate-y-4 opacity-10 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-500"></div>
              <img
                src="/quan_an_dac_san_ba_mien.png"
                alt="Đội ngũ DacSan3M đang chuẩn bị món ăn"
                className="relative rounded-3xl shadow-2xl z-10 w-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:-translate-y-2"
                loading="lazy"
              />
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl z-20 border border-gray-100 animate-bounce-slow hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-[#b51c00]">
                    <span className="material-symbols-outlined text-[32px]">
                      restaurant
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-gray-900">2+</p>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                      Năm Phục Vụ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Hương vị thật,
                <br />
                <span className="text-[#b51c00]">Chất lượng thật.</span>
              </h2>
              <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                <p>
                  Đặc Sản Ba Miền ra đời từ một ý tưởng tưởng chừng đơn giản:{" "}
                  <strong>
                    Mọi người đều xứng đáng được thưởng thức những bữa ăn nóng
                    hổi, ngon miệng, bất kể họ bận rộn đến đâu.
                  </strong>
                </p>
                <p>
                  Năm 2026, từ một góc quán cà phê nhỏ tại Sài Gòn, ba người bạn
                  đam mê công nghệ và ẩm thực đã quyết định thay đổi cách mọi
                  người đặt đồ ăn. Chúng tôi nhận thấy thị trường cần một nền
                  tảng minh bạch hơn về nguồn gốc, ổn định hơn về chất lượng và
                  thần tốc hơn trong khâu giao nhận.
                </p>
                <p>
                  Và Đặc Sản Ba Miền thành hình — không chỉ là một ứng dụng giao
                  đồ ăn, mà là một hệ sinh thái{" "}
                  <strong>ưu tiên trải nghiệm vị giác</strong>, nơi mỗi đối tác
                  nhà hàng đều là một nghệ nhân, mỗi shipper là một đại sứ mang
                  niềm vui đến cho bạn.
                </p>
              </div>
            </div>
          </div>

          {/* ================= VALUES SECTION ================= */}
          <div className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                Giá Trị Cốt Lõi
              </h2>
              <p className="text-gray-600 text-lg">
                Kim chỉ nam trong mọi hoạt động của hệ thống Đặc Sản Ba Miền.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "verified_user",
                  title: "Kiểm Định Khắt Khe",
                  desc: "100% đối tác nhà hàng phải vượt qua quy trình thẩm định vệ sinh an toàn thực phẩm 5 bước trước khi lên app.",
                },
                {
                  icon: "rocket_launch",
                  title: "Tốc Độ Ánh Sáng",
                  desc: "Hệ thống điều phối tài xế thông minh bằng AI giúp rút ngắn thời gian giao hàng xuống mức trung bình 30 phút.",
                },
                {
                  icon: "support_agent",
                  title: "Tận Tâm 24/7",
                  desc: "Đội ngũ chăm sóc khách hàng luôn túc trực. Cam kết hoàn tiền ngay lập tức nếu món ăn không đạt chuẩn.",
                },
              ].map((val, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#b51c00] transition-colors duration-300">
                    <span className="material-symbols-outlined text-[32px] text-[#b51c00] group-hover:text-white transition-colors duration-300">
                      {val.icon}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {val.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ================= STATS SECTION ================= */}
          <div className="bg-[#b51c00] rounded-[40px] p-12 md:p-16 mb-24 text-white relative overflow-hidden shadow-2xl shadow-red-900/20">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16 relative z-10">
              Những Con Số Biết Nói
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center relative z-10">
              {[
                { number: "50K+", label: "Đơn Hàng / Tháng" },
                { number: "200+", label: "Đối Tác Nhà Hàng" },
                { number: "4.8/5", label: "Đánh Giá Trung Bình" },
                { number: "30p", label: "Thời Gian Giao" },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-4xl md:text-6xl font-black mb-3 drop-shadow-md">
                    {stat.number}
                  </span>
                  <span className="text-sm md:text-base font-bold text-red-200 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ================= TEAM SECTION ================= */}
          <div className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                Đội Ngũ Sáng Lập
              </h2>
              <p className="text-gray-600 text-lg">
                Những bộ óc kết hợp giữa công nghệ tiên tiến và nghệ thuật ẩm
                thực.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  name: "Lionel Messi",
                  role: "GOAT-10",
                  exp: "Siêu sao vĩ đại với khả năng kiến tạo ý tưởng thiên tài. Người mang đến những món ăn giúp chinh phục mọi thực khách.",
                  img: "/Lionel_Messi.jpg",
                },
                {
                  name: "Nguyễn Đại",
                  role: "Software Engineer",
                  exp: "Intern Fullstack ReactJS + Node.js. Đam mê tối ưu hóa hệ thống và xây dựng trải nghiệm mượt cho hàng triệu người dùng",
                  img: "/NguyenDai.jpg",
                },
                {
                  name: "Cristiano Ronaldo",
                  role: "GOAT-7",
                  exp: "Vua phá lưới với tinh thần chiến binh bất diệt. Người đảm bảo các món ăn đều phải có hương vị và chất lượng tốt nhất.",
                  img: "/Cristiano_Ronaldo.jpg",
                },
              ].map((member, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-gray-100 text-center hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-red-50 group-hover:border-[#b51c00] transition-colors duration-300">
                    <img
                      src={member.img}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-extrabold text-xl text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#b51c00] font-bold text-sm mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed px-4">
                    {member.exp}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ================= CTA SECTION ================= */}
          <div className="bg-gray-50 rounded-[40px] p-12 md:p-20 text-center border border-gray-200">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Sẵn Sàng Khám Phá Món Ngon?
            </h2>
            <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Hàng trăm thực đơn đặc sắc đang chờ bạn thưởng thức. Đặt món ngay
              hôm nay để nhận ưu đãi vận chuyển!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="px-10 py-4 bg-[#b51c00] text-white rounded-xl font-bold hover:bg-[#8e1400] transition-all shadow-lg hover:shadow-red-900/30 active:scale-95 flex items-center justify-center gap-2"
              >
                Khám Phá Menu
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                to="/blogs"
                className="px-10 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-bold hover:border-[#b51c00] hover:text-[#b51c00] transition-all active:scale-95"
              >
                Đọc Góc Ẩm Thực
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
