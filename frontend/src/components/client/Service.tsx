const SERVICES = [
  {
    icon: "local_shipping",
    title: "Giao hàng nhanh",
    desc: "Giao hàng trong 30 phút",
  },
  {
    icon: "verified_user",
    title: "An toàn vệ sinh",
    desc: "Đảm bảo chất lượng",
  },
  {
    icon: "schedule",
    title: "Mở cửa 7/7",
    desc: "Phục vụ 7:00 – 22:00",
  },
  {
    icon: "support_agent",
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ chuyên nghiệp",
  },
];

const Service = () => {
  return (
    <section className="mt-8 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SERVICES.map(({ icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#b51c00]/30 transition-colors"
          >
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#b51c00]">
                {icon}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight truncate">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Service;
