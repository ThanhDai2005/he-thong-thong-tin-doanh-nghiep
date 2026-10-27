import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminCustomerVoucherStore } from "@/stores/useAdminCustomerVoucherStore";
import { useAdminCustomerStore } from "@/stores/useAdminCustomerStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { Gift, Users, Tag, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { toast } from "sonner";

const CustomerVoucherIssue = () => {
  const navigate = useNavigate();
  const { promotionId } = useParams<{ promotionId: string }>();
  const { user } = useAdminAuthStore();
  const { loading, issueVoucher, getDetail, currentCustomerVoucher } =
    useAdminCustomerVoucherStore();
  const {
    customers,
    fetchCustomers,
    loading: customerLoading,
  } = useAdminCustomerStore();

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [detailLoading, setDetailLoading] = useState(true);

  const canCreate = hasPermission(user, "customer_vouchers_create");

  useEffect(() => {
    const loadData = async () => {
      try {
        await getDetail(promotionId);
        setDetailLoading(false);
      } catch (error) {
        setDetailLoading(false);
        navigate("/admin/customer-vouchers");
      }
    };
    loadData();
  }, [promotionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchKeyword, "active", 1, 100);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomers.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khách hàng");
      return;
    }

    if (!promotionId) return;

    try {
      await issueVoucher(promotionId, selectedCustomers);
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDiscount = (promotion: {
    discountType: string;
    discountValue: number;
  }) => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}%`;
    }
    return formatCurrency(promotion.discountValue);
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
          { label: "Phát voucher", isCurrentPage: true },
        ]}
      />
    );
  }

  if (detailLoading) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen pb-12">
        <AdminHeader
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            {
              label: "Quản lý voucher khách hàng",
              href: "/admin/customer-vouchers",
            },
            { label: "Phát voucher", isCurrentPage: true },
          ]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
            <span className="text-sm font-semibold text-gray-600">
              Đang tải thông tin voucher...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCustomerVoucher) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen pb-12">
        <AdminHeader
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            {
              label: "Quản lý voucher khách hàng",
              href: "/admin/customer-vouchers",
            },
            { label: "Phát voucher", isCurrentPage: true },
          ]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600">Không tìm thấy voucher</p>
          </div>
        </div>
      </div>
    );
  }

  const promotion = currentCustomerVoucher.promotionId;

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý voucher khách hàng",
            href: "/admin/customer-vouchers",
          },
          { label: "Phát voucher", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Phát thêm voucher"
          subtitle="Chọn khách hàng để phát thêm voucher cho họ"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* THÔNG TIN VOUCHER */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#b51c00]/5 to-transparent">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#b51c00]" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thông tin voucher
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    Tên voucher
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    {promotion.title}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    Mã voucher
                  </div>
                  <code className="inline-block text-base font-bold text-[#92400e] bg-[#fef3c7] px-2 py-1 rounded border border-[#fde68a]">
                    {promotion.code}
                  </code>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    Giá trị giảm
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    {formatDiscount(promotion)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    Trạng thái
                  </div>
                  {promotion.status === "active" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                      Ngưng hoạt động
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    Đã phát hành
                  </div>
                  <div className="text-base font-bold text-purple-600">
                    {currentCustomerVoucher.totalIssued} voucher
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    Đã sử dụng
                  </div>
                  <div className="text-base font-bold text-green-600">
                    {currentCustomerVoucher.totalUsed} voucher
                  </div>
                </div>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Lưu ý:</span> Hệ thống sẽ tự
                  động bỏ qua các khách hàng đã nhận voucher này trước đó để
                  tránh trùng lặp.
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <AdminFormActions loading={loading} submitLabel="Phát voucher ngay" />
        </form>
      </div>
    </div>
  );
};

export default CustomerVoucherIssue;
