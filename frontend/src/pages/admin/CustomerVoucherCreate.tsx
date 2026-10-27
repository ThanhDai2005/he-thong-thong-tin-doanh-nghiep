import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCustomerVoucherStore } from "@/stores/useAdminCustomerVoucherStore";
import { useAdminCustomerStore } from "@/stores/useAdminCustomerStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { Tag, Calendar, Users, Info, Gift, X, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { toast } from "sonner";

const CustomerVoucherCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { loading, create } = useAdminCustomerVoucherStore();
  const {
    customers,
    fetchCustomers,
    loading: customerLoading,
  } = useAdminCustomerStore();

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "active",
  });

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const canCreate = hasPermission(user, "customer_vouchers_create");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchKeyword, "active", 1, 100);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.code.trim() ||
      !formData.discountValue ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (selectedCustomers.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khách hàng");
      return;
    }

    try {
      await create({
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount
          ? Number(formData.maxDiscountAmount)
          : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status as "active" | "inactive",
        customerIds: selectedCustomers,
      });
      navigate("/admin/customer-vouchers");
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c) => c._id));
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý voucher khách hàng",
            href: "/admin/customer-vouchers",
          },
          { label: "Tạo voucher mới", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý voucher khách hàng",
            href: "/admin/customer-vouchers",
          },
          { label: "Tạo voucher mới", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Tạo voucher khách hàng"
          subtitle="Tạo mã giảm giá và phát cho khách hàng cụ thể"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* THÔNG TIN CỐT LÕI */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#b51c00]/5 to-transparent">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#b51c00]" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thông tin cơ bản
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Tên voucher */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên voucher <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="VD: Voucher sinh nhật tháng 10"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  required
                />
              </div>

              {/* Mã voucher */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã voucher <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VD: BIRTHDAY10"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all font-mono uppercase"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Mã sẽ tự động viết hoa, không có khoảng trắng
                </p>
              </div>

              {/* Loại & Giá trị giảm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: e.target.value,
                        })
                      }
                      placeholder={
                        formData.discountType === "percentage"
                          ? "VD: 10"
                          : "VD: 50000"
                      }
                      min="0"
                      max={
                        formData.discountType === "percentage"
                          ? "100"
                          : undefined
                      }
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 font-semibold">
                      {formData.discountType === "percentage" ? (
                        <span className="text-xs">%</span>
                      ) : (
                        <span className="text-xs">VND</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Giảm tối đa (cho %) */}
              {formData.discountType === "percentage" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảm giá tối đa (VND)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: e.target.value,
                        })
                      }
                      placeholder="VD: 100000 (bỏ trống = không giới hạn)"
                      min="0"
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 font-semibold">
                      <span className="text-xs">VND</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Số tiền giảm tối đa khi áp dụng phần trăm
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* THỜI GIAN & GIỚI HẠN */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thời gian & Giới hạn
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Thời gian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Giới hạn số lần dùng */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới hạn số lần sử dụng
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    placeholder="VD: 100 (bỏ trống = không giới hạn)"
                    min="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Tổng số lần mã này có thể được sử dụng
                </p>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          {/* CHỌN KHÁCH HÀNG */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Chọn khách hàng nhận voucher{" "}
                  <span className="text-red-500">*</span>
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Search & Select All */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm khách hàng theo tên, số điện thoại..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {selectedCustomers.length === customers.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              </div>

              {/* Selected count */}
              {selectedCustomers.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">
                    Đã chọn {selectedCustomers.length} khách hàng
                  </span>
                </div>
              )}

              {/* Customer list */}
              <div className="border border-gray-200 rounded-lg max-h-[400px] overflow-y-auto">
                {customerLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#b51c00]" />
                    <span className="text-sm text-gray-500">
                      Đang tải danh sách khách hàng...
                    </span>
                  </div>
                ) : customers.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {customers.map((customer) => (
                      <label
                        key={customer._id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleToggleCustomer(customer._id)}
                          className="w-4 h-4 text-[#b51c00] border-gray-300 rounded focus:ring-[#b51c00] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {customer.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.phone} • {customer.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Không tìm thấy khách hàng nào
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <AdminFormActions
            loading={loading}
            submitLabel="Tạo voucher và phát ngay"
          />
        </form>
      </div>
    </div>
  );
};

export default CustomerVoucherCreate;
